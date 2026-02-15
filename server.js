console.log("👉 Server starting...");
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
mongoose.set('strictQuery', false);

// MongoDB connection with retry logic
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/manasnis', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

// Connect to MongoDB before starting server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log('\n=== Server Status ===');
        console.log(`✅ Server running on: http://localhost:${PORT}`);
        console.log(`📁 Serving files from: ${path.join(__dirname, 'client')}`);
        console.log('====================\n');
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`⛔️ Port ${PORT} is already in use`);
            process.exit(1);
        }
        console.error('Server error:', err);
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));
app.use('/js', express.static(path.join(__dirname, 'client/js')));
app.use('/css', express.static(path.join(__dirname, 'client/css')));

console.log("📦 Middleware setup done");

// Import routes
const authRoutes = require('./server/routes/auth');
const placementRoutes = require('./server/routes/placements');
// Config exposure (safe subset)
app.get('/api/config/firebase', (req, res) => {
    res.json({
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        appId: process.env.FIREBASE_APP_ID || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || ''
    });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/placements', placementRoutes);
app.get('/api/config/public', (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || ''
    });
});

// Route handlers
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Error handler for routes
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Add process error handlers
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});
