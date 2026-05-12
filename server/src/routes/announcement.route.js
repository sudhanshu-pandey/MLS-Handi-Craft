import express from 'express';
import announcementController from '../controllers/announcement.controller.js';
import adminAuthMiddleware from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Public
router.get('/active', announcementController.getActiveAnnouncements);

// Admin
router.get('/', adminAuthMiddleware, announcementController.getAllAnnouncements);
router.post('/', adminAuthMiddleware, announcementController.createAnnouncement);
router.put('/:id', adminAuthMiddleware, announcementController.updateAnnouncement);
router.delete('/:id', adminAuthMiddleware, announcementController.deleteAnnouncement);
router.get('/settings', adminAuthMiddleware, announcementController.getSettings);
router.put('/settings/update', adminAuthMiddleware, announcementController.updateSettings);

export default router;
