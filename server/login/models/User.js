const mongoose = require('mongoose');
const User = require('./User');

const seedData = [
    {
        name: "Arjun Polenwar",
        email: "arjun.polenwar@sreenidhi.edu.in",
        password: "test123",
        createdAt: new Date()
    },
    {
        name: "Rahul Kumar",
        email: "rahul.kumar@sreenidhi.edu.in",
        password: "test123",
        createdAt: new Date()
    },
    {
        name: "Priya Sharma",
        email: "priya.sharma@sreenidhi.edu.in",
        password: "test123",
        createdAt: new Date
    },
    {
        name: "Aditya Patel",
        email: "aditya.patel@sreenidhi.edu.in",
        password: "test123",
        createdAt: new Date()
    },
    {
        name: "Sneha Reddy",
        email: "sneha.reddy@sreenidhi.edu.in",
        password: "test123",
        createdAt: new Date()
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/manasnis');
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Insert new users
        const users = await User.insertMany(seedData);
        console.log('Added sample users:', users.length);

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedDatabase();