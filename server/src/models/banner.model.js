import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the banner'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description for the banner'],
      trim: true,
      maxlength: [300, 'Description cannot be more than 300 characters'],
    },
    image: {
      type: String,
      required: [true, 'Please provide an image URL for the banner'],
    },
    link: {
      type: String,
      default: '/products',
    },
    buttonText: {
      type: String,
      default: 'Shop Now',
    },
    order: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Banner', bannerSchema);
