const { body } = require('express-validator');

const createOrderValidation = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    
    body('items.*.productId')
        .notEmpty()
        .withMessage('Product ID is required for each item'),
    
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer for each item'),
    
    body('shipping.name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Shipping name must be between 2 and 100 characters')
        .escape(),
    
    body('shipping.address')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Shipping address must be between 5 and 200 characters')
        .escape(),
    
    body('shipping.city')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Shipping city must be between 2 and 100 characters')
        .escape(),
    
    body('shipping.postalCode')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Postal code must be between 3 and 20 characters')
        .escape(),
    
    body('shipping.country')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Shipping country must be between 2 and 100 characters')
        .escape(),
    
    body('shipping.phone')
        .optional()
        .trim()
        .isLength({ min: 5, max: 20 })
        .withMessage('Phone number must be between 5 and 20 characters'),
    
    body('payment.method')
        .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'])
        .withMessage('Payment method must be one of the allowed methods'),
    
    body('payment.status')
        .optional()
        .isIn(['pending', 'completed', 'failed'])
        .withMessage('Payment status must be one of: pending, completed, failed')
];

const updateOrderStatusValidation = [
    body('status')
        .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled')
];

module.exports = {
    createOrderValidation,
    updateOrderStatusValidation
};

