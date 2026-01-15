const { body }  =  require('express-validator');

const productValidation = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Product name must be between 3 and 100 characters')
        .escape(),
    body('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Product description must be between 10 and 1000 characters')
        .escape(),
    body('price.value')
        .isFloat({ gt: 0 })
        .withMessage('Price value must be a number greater than 0'),
    body('price.currency')
        .optional()
        .isString()
        .withMessage('Currency must be a string'),
    body('stock.quantity')
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be a non-negative integer'),
    body('stock.reserved')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Reserved stock must be a non-negative integer'),
];

module.exports = {
    productValidation
};