import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Please provide announcement text'],
      trim: true,
      maxlength: [500, 'Announcement text cannot exceed 500 characters'],
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

export default mongoose.model('Announcement', announcementSchema);
