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
        return calculateCartTotals(emptyCart);
    }
    const cart = {
        id: cartDoc.id,
        ...cartDoc.data()
    };
    return calculateCartTotals(cart);
};

const calculateCartTotals = (cart) => {
    const totals = cart.items.reduce((acc, item) => {
        const price = typeof item.price === 'number' ? item.price : (item.price?.value || 0);
        const itemTotal = price * item.quantity;

        return {
            subtotal: acc.subtotal + itemTotal,
            itemCount: acc.itemCount + item.quantity,
        };
    }, { subtotal: 0, itemCount: 0 });

    return {
        ...cart,
        totals: {
            subtotal: totals.subtotal,
            itemCount: totals.itemCount,
            total: totals.subtotal,
        }
    };
};

const addItemToCart = async (userId, productId, quantity = 1) => {
    const productDoc = await productsCollection.doc(productId).get();
    if (!productDoc.exists) {
        throw new Error('Product not found');
    }

    const product = productDoc.data();

    const availableStock = (product.stock?.quantity || 0) - (product.stock?.reserved || 0);

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
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        if (newQuantity > availableStock) {
            throw new Error(`Only ${availableStock} items available in stock`);
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = product.price;
        cart.items[existingItemIndex].productName = product.name;
        const primaryImage = product.images?.find(img => img.isPrimary);
        cart.items[existingItemIndex].image = primaryImage?.url || product.images?.[0]?.url || null;
    } else {
        if (quantity > availableStock) {
            throw new Error(`Only ${availableStock} items available in stock`);
        }

        const primaryImage = product.images?.find(img => img.isPrimary);
        cart.items.push({
            productId,
            productName: product.name,
            price: product.price,
            image: primaryImage?.url || product.images?.[0]?.url || null,
            quantity,
            addedAt: new Date().toISOString()
        });
    }

    cart.metadata.updatedAt = new Date().toISOString();

    await cartsCollection.doc(userId).set(cart, { merge: true });

    return calculateCartTotals(cart);
};

const updateCartItem = async (userId, productId, quantity) => {
    if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
    }

    const productDoc = await productsCollection.doc(productId).get();
    if (!productDoc.exists) {
        throw new Error('Product not found');
    }

    const product = productDoc.data();
    const availableStock = (product.stock?.quantity || 0) - (product.stock?.reserved || 0);

    if (quantity > availableStock) {
        throw new Error(`Only ${availableStock} items available in stock`);
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

    return calculateCartTotals(cart);
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

    return calculateCartTotals(cart);
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

    return calculateCartTotals(cart);
};

module.exports = {
    getCartByUserId,
    addItemToCart,
    updateCartItem,
    removeItemFromCart,
    clearCart
};