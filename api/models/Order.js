const db = require('../db');

const ordersCollection = db.collection('orders');
const productsCollection = db.collection('products');

const createOrderInDb = async (orderData) => {
    const docRef = await ordersCollection.add(orderData);
    return docRef;
};

const getOrderByIdFromDb = async (orderId) => {
    const orderDoc = await ordersCollection.doc(orderId).get();
    if (!orderDoc.exists) {
        return null;
    }
    return {
        id: orderDoc.id,
        ...orderDoc.data()
    };
};

const getOrdersByUserIdFromDb = async (userId) => {
    const snapshot = await ordersCollection
        .where('userId', '==', userId)
        .get();

    const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    orders.sort((a, b) => {
        const dateA = a.metadata?.createdAt || '';
        const dateB = b.metadata?.createdAt || '';
        return dateB.localeCompare(dateA);
    });

    return orders;
};

const getAllOrdersFromDb = async (limit = 50) => {
    const snapshot = await ordersCollection
        .orderBy('metadata.createdAt', 'desc')
        .limit(limit)
        .get();

    const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return orders;
};

const updateOrderStatusInDb = async (orderId, status, updatedBy = null, paymentStatus = null) => {
    const orderRef = ordersCollection.doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
        throw new Error('Order not found');
    }

    const updateData = {
        status,
        'metadata.updatedAt': new Date().toISOString()
    };

    if (updatedBy) {
        updateData['metadata.updatedBy'] = updatedBy;
    }

    if (paymentStatus) {
        updateData['payment.status'] = paymentStatus;
    }

    await orderRef.update(updateData);

    const updatedDoc = await orderRef.get();

    return {
        id: updatedDoc.id,
        ...updatedDoc.data()
    };
};

const validateAndReserveStock = async (items) => {
    const validationErrors = [];
    const productUpdates = [];
    const productData = [];

    for (const item of items) {
        const productDoc = await productsCollection.doc(item.productId).get();

        if (!productDoc.exists) {
            validationErrors.push({
                productId: item.productId,
                error: 'Product not found'
            });
            continue;
        }

        const product = productDoc.data();
        const availableStock = (product.stock?.quantity || 0) - (product.stock?.reserved || 0);

        if (availableStock < item.quantity) {
            validationErrors.push({
                productId: item.productId,
                productName: product.name,
                requested: item.quantity,
                available: availableStock,
                error: 'Insufficient stock'
            });
            continue;
        }

        if (!product.flags?.active) {
            validationErrors.push({
                productId: item.productId,
                productName: product.name,
                error: 'Product is not available'
            });
            continue;
        }

        productUpdates.push({
            productId: item.productId,
            quantity: item.quantity
        });

        productData.push({
            id: productDoc.id,
            ...product
        });
    }

    if (validationErrors.length > 0) {
        throw {
            name: 'StockValidationError',
            errors: validationErrors
        };
    }

    const stockUpdatePromises = productUpdates.map(update => {
        return updateProductStockForOrder(update.productId, 0, update.quantity);
    });

    await Promise.all(stockUpdatePromises);

    return productData;
};

const finalizeStockForOrder = async (items) => {
    const stockUpdatePromises = items.map(item => {
        return updateProductStockForOrder(item.productId, -item.quantity, -item.quantity);
    });

    await Promise.all(stockUpdatePromises);
};

const updateProductStockForOrder = async (productId, quantityChange, reservedChange) => {
    const productRef = productsCollection.doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
        throw new Error(`Product ${productId} not found`);
    }

    const currentProduct = productDoc.data();
    const currentQuantity = currentProduct.stock?.quantity || 0;
    const currentReserved = currentProduct.stock?.reserved || 0;

    const newQuantity = Math.max(0, currentQuantity + quantityChange);
    const newReserved = Math.max(0, currentReserved + reservedChange);

    const finalReserved = Math.min(newReserved, newQuantity);

    await productRef.update({
        'stock.quantity': newQuantity,
        'stock.reserved': finalReserved,
        'metadata.updatedAt': new Date().toISOString()
    });
};

module.exports = {
    createOrderInDb,
    getOrderByIdFromDb,
    getOrdersByUserIdFromDb,
    getAllOrdersFromDb,
    updateOrderStatusInDb,
    validateAndReserveStock,
    finalizeStockForOrder,
    updateProductStockForOrder
};