const { getCartByUserId, addItemToCart, updateCartItem, removeItemFromCart, clearCart } = require('../models/Cart');

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await getCartByUserId(userId);
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
};

const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        const qty = quantity && quantity > 0 ? parseInt(quantity) : 1;
        
        const cart = await addItemToCart(userId, productId, qty);
        res.status(200).json(cart);
    } catch (error) {
        if (error.message === 'Product not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
};

const updateCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be a positive number' });
        }

        const cart = await updateCartItem(userId, productId, parseInt(quantity));
        res.status(200).json(cart);
    } catch (error) {
        if (error.message === 'Cart not found' || error.message === 'Item not found in cart') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update cart item' });
    }
};

const deleteFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const cart = await removeItemFromCart(userId, productId);
        res.status(200).json(cart);
    } catch (error) {
        if (error.message === 'Cart not found' || error.message === 'Item not found in cart') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
};

const clearUserCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await clearCart(userId);
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear cart' });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCart,
    deleteFromCart,
    clearUserCart
};

