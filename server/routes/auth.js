const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Signup route
router.post('/signup', async (req, res) => {
    try {
        console.log('Received signup request:', req.body);
        const { name, email, password } = req.body;
        
        // Validate email domain
        if (!email.endsWith('@sreenidhi.edu.in')) {
            return res.status(400).json({ 
                message: 'Please use your Sreenidhi email address' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists' 
            });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password // Note: In production, hash this password
        });

        await user.save();
        console.log('User created successfully:', user.email);

        res.status(201).json({ 
            message: 'User created successfully',
            user: { name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                message: 'User not found' 
            });
        }

        // Check password (Add proper password hashing in production)
        if (user.password !== password) {
            return res.status(400).json({ 
                message: 'Invalid password' 
            });
        }

        res.json({ 
            message: 'Login successful',
            user: { name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;