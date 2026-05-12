import mongoose from 'mongoose';

const announcementSettingsSchema = new mongoose.Schema(
  {
    separator: {
      type: String,
      default: '  |  ',
      trim: true,
    },
    speed: {
      type: Number,
      default: 20,
      min: 5,
      max: 60,
    },
    spacing: {
      type: Number,
      default: 50,
      min: 10,
      max: 300,
    },
  },
  { timestamps: true }
);

export default mongoose.model('AnnouncementSettings', announcementSettingsSchema);
