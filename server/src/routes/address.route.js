import express from 'express';
import { 
  getAddresses, 
  addAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress 
} from '../controllers/address.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All address routes require authentication
router.use(authMiddleware);

/**
 * GET /address - Get all addresses for user
 */
router.get('/', getAddresses);

/**
 * POST /address - Add new address
 */
router.post('/', addAddress);

/**
 * PUT /address/:id - Update address
 */
router.put('/:id', updateAddress);

/**
 * DELETE /address/:id - Delete address
 */
router.delete('/:id', deleteAddress);

/**
 * PUT /address/default/:id - Set address as default
 * Note: This route must come AFTER the /:id route to avoid conflicts
 */
router.put('/default/:id', setDefaultAddress);

export default router;
