console.log("👉 Server starting...");

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));
app.use('/js', express.static(path.join(__dirname, 'client/js')));
app.use('/css', express.static(path.join(__dirname, 'client/css')));

console.log("📦 Middleware setup done");

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/manasnis', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Import routes
const authRoutes = require('./src/routes/auth');

// Use routes
app.use('/api/auth', authRoutes);

// Socket.IO Setup
io.on('connection', (socket) => {
    console.log(`🟢 Client connected: ${socket.id}`);
    
    socket.on('chat', (message) => {
        io.emit('chat', { id: socket.id, msg: message });
    });

    socket.on('disconnect', () => {
        console.log(`🔴 Client disconnected: ${socket.id}`);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
