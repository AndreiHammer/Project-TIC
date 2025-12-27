const express = require('express');
const { login, register } = require('../controllers/userController');
const { authValidation, registerValidation } = require('../validators/authValidator');

const router = express.Router();

router.post('/login', authValidation, login);
router.post('/register', registerValidation, register);

module.exports = router;