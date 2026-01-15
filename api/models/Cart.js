const db = require('../db');

const cartsCollection = db.collection('carts');
const productsCollection = db.collection('products');

const getCartByUserId = async (userId) => {
    const cartDoc = await cartsCollection.doc(userId).get();
    if (!cartDoc.exists) {
        const emptyCart = {
            userId,
            items: [],
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        };
        await cartsCollection.doc(userId).set(emptyCart);
        return emptyCart;
    }
    return {
        id: cartDoc.id,
        ...cartDoc.data()
    };
};

const addItemToCart = async (userId, productId, quantity = 1) => {
    const productDoc = await productsCollection.doc(productId).get();
    if (!productDoc.exists) {
        throw new Error('Product not found');
    }

    const product = productDoc.data();
    
    const cartDoc = await cartsCollection.doc(userId).get();
    let cart;
    
    if (!cartDoc.exists) {
        cart = {
            userId,
            items: [],
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        };
    } else {
        cart = {
            id: cartDoc.id,
            ...cartDoc.data()
        };
    }

    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        cart.items.push({
            productId,
            productName: product.name,
            price: product.price,
            quantity,
            addedAt: new Date().toISOString()
        });
    }

    cart.metadata.updatedAt = new Date().toISOString();

    await cartsCollection.doc(userId).set(cart, { merge: true });
    
    return cart;
};

const updateCartItem = async (userId, productId, quantity) => {
    if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
    }

    const cartDoc = await cartsCollection.doc(userId).get();
    if (!cartDoc.exists) {
        throw new Error('Cart not found');
    }

    const cart = {
        id: cartDoc.id,
        ...cartDoc.data()
    };

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex < 0) {
        throw new Error('Item not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;
    cart.metadata.updatedAt = new Date().toISOString();

    await cartsCollection.doc(userId).set(cart, { merge: true });
    
    return cart;
};

const removeItemFromCart = async (userId, productId) => {
    const cartDoc = await cartsCollection.doc(userId).get();
    if (!cartDoc.exists) {
        throw new Error('Cart not found');
    }

    const cart = {
        id: cartDoc.id,
        ...cartDoc.data()
    };

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex < 0) {
        throw new Error('Item not found in cart');
    }

    cart.items.splice(itemIndex, 1);
    cart.metadata.updatedAt = new Date().toISOString();

    await cartsCollection.doc(userId).set(cart, { merge: true });
    
    return cart;
};

const clearCart = async (userId) => {
    const cart = {
        userId,
        items: [],
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    };

    await cartsCollection.doc(userId).set(cart, { merge: true });
    
    return cart;
};

module.exports = {
    getCartByUserId,
    addItemToCart,
    updateCartItem,
    removeItemFromCart,
    clearCart
};

