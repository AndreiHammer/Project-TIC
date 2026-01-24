const { validationResult } = require('express-validator');
const {
    createOrderInDb,
    getOrderByIdFromDb,
    getOrdersByUserIdFromDb,
    getAllOrdersFromDb,
    updateOrderStatusInDb,
    validateAndReserveStock,
    finalizeStockForOrder,
    updateProductStockForOrder
} = require('../models/Order');
const { getProductByIdFromDb } = require('../models/Product');
const { getCartByUserId, clearCart } = require('../models/Cart');
const { findUserById } = require('../models/User');

const validateStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
        'shipped': ['delivered', 'cancelled'],
        'delivered': [],
        'cancelled': []
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
};

const createOrder = async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ error: validationErrors.array() });
    }

    try {
        const userId = req.user.id;
        const { items, shipping, payment } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                error: 'Order must contain at least one item'
            });
        }

        let products;
        try {
            products = await validateAndReserveStock(items);
        } catch (error) {
            if (error.name === 'StockValidationError') {
                return res.status(400).json({
                    error: 'Stock validation failed',
                    details: error.errors
                });
            }
            throw error;
        }

        let total = 0;
        let currency = 'EUR';
        const orderItems = [];

        for (const item of items) {
            const product = products.find(p => p.id === item.productId);

            if (!product) {
                return res.status(400).json({
                    error: `Product ${item.productId} not found`
                });
            }

            const price = product.price?.value || 0;
            const subtotal = price * item.quantity;
            total += subtotal;

            if (orderItems.length === 0) {
                currency = product.price?.currency || 'EUR';
            }

            orderItems.push({
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                quantity: item.quantity,
                price: {
                    value: price,
                    currency: product.price?.currency || 'EUR'
                },
                subtotal: parseFloat(subtotal.toFixed(2))
            });
        }

        const orderData = {
            userId,
            items: orderItems,
            total: parseFloat(total.toFixed(2)),
            currency,
            shipping: {
                name: shipping.name,
                address: shipping.address,
                city: shipping.city,
                postalCode: shipping.postalCode,
                country: shipping.country,
                phone: shipping.phone || null
            },
            payment: {
                method: payment.method,
                status: payment.status || 'pending'
            },
            status: 'pending',
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        };

        const orderRef = await createOrderInDb(orderData);
        const order = {
            id: orderRef.id,
            ...orderData
        };

        try {
            await clearCart(userId);
        } catch (cartError) {
            console.error('Failed to clear cart after order creation:', cartError);
        }

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await findUserById(userId);
        const isAdmin = user?.admin || false;

        let orders;
        if (isAdmin) {
            orders = await getAllOrdersFromDb();
        } else {
            orders = await getOrdersByUserIdFromDb(userId);
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const user = await findUserById(userId);
        const isAdmin = user?.admin || false;

        const order = await getOrderByIdFromDb(id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (!isAdmin && order.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

const updateOrderStatus = async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ error: validationErrors.array() });
    }

    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedBy = req.user.id;

        const order = await getOrderByIdFromDb(id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'delivered') {
            return res.status(400).json({
                error: 'Cannot update status of delivered orders'
            });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({
                error: 'Cannot update status of cancelled orders'
            });
        }

        if (!validateStatusTransition(order.status, status)) {
            return res.status(400).json({
                error: `Invalid status transition from ${order.status} to ${status}`
            });
        }

        if (status === 'cancelled') {
            try {
                if (['processing', 'shipped'].includes(order.status)) {
                    const stockRestorePromises = order.items.map(item => {
                        return updateProductStockForOrder(item.productId, item.quantity, 0);
                    });
                    await Promise.all(stockRestorePromises);
                } else if (['pending', 'confirmed'].includes(order.status)) {
                    const stockRestorePromises = order.items.map(item => {
                        return updateProductStockForOrder(item.productId, 0, -item.quantity);
                    });
                    await Promise.all(stockRestorePromises);
                }
            } catch (stockError) {
                console.error('Failed to restore stock during status update to cancelled:', stockError);
                return res.status(500).json({
                    error: 'Failed to restore stock. Status update aborted.'
                });
            }
        }

        if (['processing', 'shipped', 'delivered'].includes(status) &&
            ['pending', 'confirmed'].includes(order.status)) {
            await finalizeStockForOrder(order.items);
        }

        let paymentStatus = order.payment?.status || 'pending';
        if (status === 'delivered') {
            paymentStatus = 'completed';
        } else if (status === 'cancelled') {
            paymentStatus = 'failed';
        } else if (['processing', 'shipped'].includes(status)) {
            paymentStatus = 'completed';
        }

        const updatedOrder = await updateOrderStatusInDb(id, status, updatedBy, paymentStatus);

        res.status(200).json({
            message: 'Order status updated successfully',
            order: updatedOrder
        });
    } catch (error) {
        console.error('Update order status error:', error);
        if (error.message === 'Order not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const order = await getOrderByIdFromDb(id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const user = await findUserById(userId);
        const isAdmin = user?.admin || false;

        if (!isAdmin && order.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to cancel this order' });
        }

        if (order.status === 'delivered') {
            return res.status(400).json({
                error: 'Cannot cancel delivered orders'
            });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({
                error: 'Order is already cancelled'
            });
        }

        if (!isAdmin && !['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                error: `Cannot cancel order with status: ${order.status}. Only pending and confirmed orders can be cancelled.`
            });
        }

        try {
            if (['processing', 'shipped'].includes(order.status)) {
                const stockRestorePromises = order.items.map(item => {
                    return updateProductStockForOrder(item.productId, item.quantity, 0);
                });
                await Promise.all(stockRestorePromises);
            } else if (['pending', 'confirmed'].includes(order.status)) {
                const stockRestorePromises = order.items.map(item => {
                    return updateProductStockForOrder(item.productId, 0, -item.quantity);
                });
                await Promise.all(stockRestorePromises);
            }
        } catch (stockError) {
            console.error('Failed to restore stock during cancellation:', stockError);
            return res.status(500).json({
                error: 'Failed to restore stock. Order cancellation aborted.'
            });
        }

        await updateOrderStatusInDb(id, 'cancelled', userId, 'failed');

        const cancelledOrder = await getOrderByIdFromDb(id);

        res.status(200).json({
            message: 'Order cancelled successfully',
            order: cancelledOrder
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        if (error.message === 'Order not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to cancel order' });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder
};