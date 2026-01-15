const express = require('express');
const { getCart, addToCart, updateCart, deleteFromCart, clearUserCart } = require('../controllers/cartController');
const { verifyToken } = require('../utils/jwtUtils');

const router = express.Router();

router.get('/', verifyToken, getCart);
router.post('/', verifyToken, addToCart);
router.put('/:productId', verifyToken, updateCart);
router.delete('/:productId', verifyToken, deleteFromCart);
router.delete('/', verifyToken, clearUserCart);

module.exports = router;

