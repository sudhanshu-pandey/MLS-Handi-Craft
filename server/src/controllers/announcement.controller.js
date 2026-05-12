import Announcement from '../models/announcement.model.js';
import AnnouncementSettings from '../models/announcementSettings.model.js';

// Get all active announcements + settings (public)
const getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ active: true }).sort({ createdAt: -1 });
    let settings = await AnnouncementSettings.findOne();
    if (!settings) settings = { separator: '  |  ', speed: 20, spacing: 50 };
    res.json({ success: true, data: announcements, settings: { separator: settings.separator, speed: settings.speed, spacing: settings.spacing } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all announcements (admin)
const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const { text, active } = req.body;
    const announcement = await Announcement.create({ text, active });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { text, active } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { text, active },
      { new: true, runValidators: true }
    );
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get settings
const getSettings = async (req, res) => {
  try {
    let settings = await AnnouncementSettings.findOne();
    if (!settings) settings = await AnnouncementSettings.create({});
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update settings
const updateSettings = async (req, res) => {
  try {
    const { separator, speed, spacing } = req.body;
    let settings = await AnnouncementSettings.findOne();
    if (!settings) settings = await AnnouncementSettings.create({ separator, speed, spacing });
    else {
      if (separator !== undefined) settings.separator = separator;
      if (speed !== undefined) settings.speed = speed;
      if (spacing !== undefined) settings.spacing = spacing;
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export default { getActiveAnnouncements, getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, getSettings, updateSettings };
