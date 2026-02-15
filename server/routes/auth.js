const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Signup route
router.post('/signup', async (req, res) => {
    try {
        console.log('Received signup request:', req.body);
        const { name, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists' 
            });
        }

       
        const user = new User({
            name,
            email,
            password 
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


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                message: 'User not found' 
            });
        }

        
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

// Google OAuth login
router.post('/google', async (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({ message: 'Google auth not configured' });
        }
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: 'Missing credential' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const email = payload?.email;
        const name = payload?.name || 'SNIST User';

        if (!email) {
            return res.status(400).json({ message: 'Unable to read email from Google token' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                name,
                email,
                password: 'google-oauth' // placeholder to satisfy current schema
            });
            await user.save();
        }

        res.json({
            message: 'Google login successful',
            user: { name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ message: 'Google authentication failed' });
    }
});

module.exports = router;
