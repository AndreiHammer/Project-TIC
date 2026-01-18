const { validationResult } = require('express-validator');
const { getAllProductsFromDb, getProductByIdFromDb, createProductInDb, updateProductInDb, deleteProductInDb, updateProductStockInDb } = require('../models/Product');

const getAllProducts = async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 12;
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
        const search = req.query.search || null;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';

        const filters = {
            minPrice,
            maxPrice,
            search,
            sortBy,
            sortOrder
        };

        const result = await getAllProductsFromDb(offset, limit, filters);

        res.status(200).json({
            products: result.products,
            pagination: {
                offset: offset,
                limit: limit,
                totalProducts: result.totalProducts,
                hasMore: offset + limit < result.totalProducts
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await getProductByIdFromDb(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

const createProduct = async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ error: validationErrors.array() });
    }
    try {
        const productData = req.body;
        const newProductRef = await createProductInDb(productData);
        res.status(201).json({ id: newProductRef.id, ...productData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ error: validationErrors.array() });
    }
    try {
        const productData = req.body;
        await updateProductInDb(id, productData);
        res.status(200).json({ id, ...productData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await deleteProductInDb(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

const updateProductStock = async (req, res) => {
    const { id } = req.params;
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ error: validationErrors.array() });
    }
    try {
        const { quantityChange, reservedChange } = req.body;
        const updatedProduct = await updateProductStockInDb(id, quantityChange, reservedChange || 0);
        res.status(200).json({
            message: 'Stock updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        if (error.message === 'Product not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update product stock' });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock
};