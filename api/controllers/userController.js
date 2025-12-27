const { validationResult } = require('express-validator');
const { findUserByEmail, findUserByUsername, addNewUser, verifyPassword, updateLastLogin } = require('../models/User');
const { hashPassword, generateToken } = require('../utils/jwtUtils');

const sanitizeValidationErrors = (errors) => {
    const sensitiveFields = ['password', 'confirmPassword'];
    return errors.map(error => {
        if (sensitiveFields.includes(error.path)) {
            const { value, ...errorWithoutValue } = error;
            return errorWithoutValue;
        }
        return error;
    });
};

const login = async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            error : sanitizeValidationErrors(validationErrors.array())
        })
    }
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const user = await findUserByEmail(email);

        if(!user) {
            return res.status(401).json({error : 'Invalid Login'});
        }

        const isValidPassword = await verifyPassword(password, user.password);

        if(!isValidPassword) {
            return res.status(401).json({error : 'Invalid Login'});
        }

        await updateLastLogin(user.id);

        const token = generateToken({
            id: user.id,
            email: user.email,
            username: user.username  
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username  
            }
        });
    } catch(error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

const register = async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            error : sanitizeValidationErrors(validationErrors.array())
        })
    }
    try {
        const { email, password, username, confirmPassword } = req.body;
        
        const existingUserByEmail = await findUserByEmail(email); 
        if (existingUserByEmail) {
            return res.status(409).json({
                error: 'User with this email already exists'
            });
        }

        const existingUserByUsername = await findUserByUsername(username);
        if (existingUserByUsername) {
            return res.status(409).json({
                error: 'Username is already taken'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Passwords do not match'
            });
        }

        const hashedPassword = await hashPassword(password);
        
        const newUser = {
            email,
            username,  
            password: hashedPassword,
            profile: {  
                displayName: username,  
                createdAt: new Date().toISOString()
            },
            metadata: {  
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLogin: null
            }
        };

        const docRef = await addNewUser(newUser);  

        const token = generateToken({
            id: docRef.id,
            email: email,
            username: username 
        }); 
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: docRef.id, 
                email: email,
                username: username  
            }
        });
    } catch(error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

module.exports = {
    login,
    register
};