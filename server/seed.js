const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('./models/Admin');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campus-incidents';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists, skipping seed');
    } else {
      const admin = new Admin({
        username: 'admin',
        password: 'admin123'
      });
      await admin.save();
      console.log('Default admin user created (username: admin, password: admin123)');
    }

    await mongoose.disconnect();
    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
