const express = require('express');
const { login, register, registerAdmin, getUsersCount } = require('../controllers/userController');
const { authValidation, registerValidation } = require('../validators/authValidator');
const { verifyToken, requireAdmin } = require('../utils/jwtUtils');

const router = express.Router();

router.post('/login', authValidation, login);
router.post('/register', registerValidation, register);
router.post('/register-admin', registerValidation, registerAdmin);
router.get('/count', verifyToken, requireAdmin, getUsersCount);

module.exports = router;