import mongoose from 'mongoose';
import Category from '../models/category.model.js';
import dotenv from 'dotenv';

dotenv.config();

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/handi-craft');
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // New categories to add
    const categories = [
      {
        name: 'Pooja Thali',
        slug: 'pooja-thali',
        image: 'https://via.placeholder.com/300x300?text=Pooja+Thali',
        description: 'Traditional pooja thali for religious ceremonies',
        active: true
      },
      {
        name: 'Perse',
        slug: 'perse',
        image: 'https://via.placeholder.com/300x300?text=Perse',
        description: 'Traditional perse for religious purposes',
        active: true
      },
      {
        name: 'Chatra',
        slug: 'chatra',
        image: 'https://via.placeholder.com/300x300?text=Chatra',
        description: 'Decorative chatra for various uses',
        active: true
      },
      {
        name: 'Rose Water Sprinklers',
        slug: 'rose-water-sprinklers',
        image: 'https://via.placeholder.com/300x300?text=Rose+Water+Sprinklers',
        description: 'Elegant rose water sprinklers',
        active: true
      },
      {
        name: 'Akhand Diya',
        slug: 'akhand-diya',
        image: 'https://via.placeholder.com/300x300?text=Akhand+Diya',
        description: 'Traditional eternal diya for worship',
        active: true
      }
    ];

    // Insert categories
    const insertedCategories = await Category.insertMany(categories);
    console.log('✅ Successfully seeded 5 categories:', insertedCategories.map(c => c.name));

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error seeding categories:', error.message);
    process.exit(1);
  }
};

seedCategories();
