console.log("👉 Server starting...");

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

console.log("📦 Middleware setup done");

// Connect to SQLite
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) return console.error(err.message);
    console.log("✅ Connected to SQLite database.");
});

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
)`);

// Signup route
app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
    db.run(query, [name, email, password], function (err) {
        if (err) {
            res.status(400).json({ message: 'User already exists or error occurred' });
        } else {
            res.status(200).json({ message: 'User registered successfully' });
        }
    });
});


// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
