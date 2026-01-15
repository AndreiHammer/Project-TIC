const { validationResult } = require('express-validator');
const {
    createOrderInDb,
    getOrderByIdFromDb,
    getOrdersByUserIdFromDb,
    getAllOrdersFromDb,
    updateOrderStatusInDb,
    cancelOrderInDb,
    validateAndReserveStock,
    finalizeStockForOrder
} = require('../models/Order');
const { getProductByIdFromDb } = require('../models/Product');
const { getCartByUserId, clearCart } = require('../models/Cart');
const { findUserById } = require('../models/User');

const createOrder = async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ error: validationErrors.array() });
    }

    try {
        const userId = req.user.id;
        const { items, shipping, payment } = req.body;

        try {
            await validateAndReserveStock(items);
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
        const orderItems = [];

        for (const item of items) {
            const product = await getProductByIdFromDb(item.productId);
            
            if (!product) {
                return res.status(400).json({
                    error: `Product ${item.productId} not found`
                });
            }

            const price = product.price?.value || 0;
            const subtotal = price * item.quantity;
            total += subtotal;

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

        if (['processing', 'shipped', 'delivered'].includes(status) && 
            ['pending', 'confirmed'].includes(order.status)) {
            await finalizeStockForOrder(order.items);
        }

        const updatedOrder = await updateOrderStatusInDb(id, status, updatedBy);

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

        const cancelledOrder = await cancelOrderInDb(id, userId);

        res.status(200).json({
            message: 'Order cancelled successfully',
            order: cancelledOrder
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        if (error.message === 'Order not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Unauthorized to cancel this order') {
            return res.status(403).json({ error: error.message });
        }
        if (error.message.includes('Cannot cancel order')) {
            return res.status(400).json({ error: error.message });
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

