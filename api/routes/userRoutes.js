const express = require('express');
const { login, register, registerAdmin } = require('../controllers/userController');
const { authValidation, registerValidation } = require('../validators/authValidator');

const router = express.Router();

router.post('/login', authValidation, login);
router.post('/register', registerValidation, register);
router.post('/register-admin', registerValidation, registerAdmin);

module.exports = router;