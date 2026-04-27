import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from '../models/banner.model.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedBanners = async () => {
  try {
    // Clear existing banners
    await Banner.deleteMany({});

    const banners = [
      {
        title: 'Welcome to MLS Handicrafts',
        description: 'Discover authentic, handcrafted products that celebrate tradition and artistry',
        image: 'https://handi-craft.s3.amazonaws.com/banners/welcome-banner.jpg',
        link: '/products',
        buttonText: 'Shop Now',
        order: 1,
        active: true,
      },
      {
        title: 'Pooja Thali Collection',
        description: 'Beautiful brass and copper pooja thalis for your spiritual rituals',
        image: 'https://handi-craft.s3.amazonaws.com/banners/pooja-thali-banner.jpg',
        link: '/products?category=pooja-thali',
        buttonText: 'Explore',
        order: 2,
        active: true,
      },
      {
        title: 'Artisan Crafts',
        description: 'Handmade with love - Traditional crafts from across India',
        image: 'https://handi-craft.s3.amazonaws.com/banners/artisan-banner.jpg',
        link: '/products',
        buttonText: 'View Collection',
        order: 3,
        active: true,
      },
    ];

    const result = await Banner.insertMany(banners);
    console.log(`✓ ${result.length} banners seeded successfully`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding banners:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => seedBanners());
