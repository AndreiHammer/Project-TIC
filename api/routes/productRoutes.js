const express = require('express');
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, updateProductStock } = require('../controllers/productController');
const { productValidation } = require('../validators/productValidator');
const { stockUpdateValidation } = require('../validators/stockValidator');
const { verifyToken, requireAdmin } = require('../utils/jwtUtils');

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.patch('/:id/stock', verifyToken, stockUpdateValidation, updateProductStock);

router.post('/', verifyToken, requireAdmin, productValidation, createProduct);
router.put('/:id', verifyToken, requireAdmin, productValidation, updateProduct);
router.delete('/:id', verifyToken, requireAdmin, deleteProduct);

module.exports = router;