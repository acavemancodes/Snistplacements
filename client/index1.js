const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Fix the User model import path
const User = require(path.join(__dirname, '..', 'models', 'User.js'));

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

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
    server.listen(PORT, () => {
        console.log('\n=== Server Status ===');
        console.log(`✅ Server running on: http://localhost:${PORT}`);
        console.log(`📁 Serving files from: ${__dirname}`);
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
app.use(express.static(path.join(__dirname)));

// Route handlers
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/signup', async (req, res) => {
    try {
        console.log('Received signup request:', req.body);
        const { name, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password
        });

        const savedUser = await user.save();
        console.log('User saved successfully:', {
            id: savedUser._id,
            email: savedUser.email,
            name: savedUser.name
        });
        
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Detailed signup error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Error handler for routes
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log(`🟢 ${socket.id} connected`);

  // Fixed: Receive message directly and emit with ID
  socket.on('chat', (message) => {
    io.emit('chat', {
      id: socket.id,
      msg: message
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔴 ${socket.id} disconnected`);
    io.emit('sys', 'A user has left the chat');
  });

  // Notify others when someone joins
  io.emit('sys', 'A new user has joined the chat');
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
