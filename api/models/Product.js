const db = require('../db');

const productsCollection = db.collection('products');

const getAllProductsFromDb = async () => {
    const snapshot = await productsCollection.get();
    const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    return products;
};

const getProductByIdFromDb = async (productId) => {
    const productDoc = await productsCollection.doc(productId).get();
    if (!productDoc.exists) {
        return null;
    }
    return {
        id: productDoc.id,
        ...productDoc.data()
    };
};

const createProductInDb = async (productData) => {
    const docRef = await productsCollection.add(productData);
    return docRef;
};

const updateProductInDb = async (productId, productData) => {
    const productRef = productsCollection.doc(productId);
    await productRef.update(productData);
    return productRef;
};

const deleteProductInDb = async (productId) => {
    const productRef = productsCollection.doc(productId);
    await productRef.delete();
    return;
};

const updateProductStockInDb = async (productId, quantityChange, reservedChange = 0) => {
    const productRef = productsCollection.doc(productId);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
        throw new Error('Product not found');
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
    
    return {
        id: productDoc.id,
        stock: {
            quantity: newQuantity,
            reserved: finalReserved
        }
    };
};

module.exports = {
    getAllProductsFromDb,
    getProductByIdFromDb,
    createProductInDb,
    updateProductInDb,
    deleteProductInDb,
    updateProductStockInDb
};