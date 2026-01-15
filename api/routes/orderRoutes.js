const express = require('express');
const { createOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { createOrderValidation, updateOrderStatusValidation } = require('../validators/orderValidator');
const { verifyToken, requireAdmin } = require('../utils/jwtUtils');

const router = express.Router();

router.post('/', verifyToken, createOrderValidation, createOrder);
router.get('/', verifyToken, getOrders);
router.get('/:id', verifyToken, getOrderById);
router.patch('/:id/status', verifyToken, requireAdmin, updateOrderStatusValidation, updateOrderStatus);
router.post('/:id/cancel', verifyToken, cancelOrder);

module.exports = router;

