const { body } = require('express-validator');

const stockUpdateValidation = [
    body('quantityChange')
        .isInt()
        .withMessage('Quantity change must be an integer'),
    body('reservedChange')
        .optional()
        .isInt()
        .withMessage('Reserved change must be an integer')
];

module.exports = {
    stockUpdateValidation
};

