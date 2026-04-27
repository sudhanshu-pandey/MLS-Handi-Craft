import User from "../models/user.model.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * Get all addresses for the logged-in user
 * GET /address
 */
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        message: 'User not found' 
      });
    }

    res.json({ 
      addresses: user.addresses || [],
      count: (user.addresses || []).length 
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: 'Failed to fetch addresses',
      error: error.message 
    });
  }
};

/**
 * Add a new address
 * POST /address
 */
export const addAddress = async (req, res) => {
  try {
    console.log('Add Address Request Body:', req.body); // Debug log
    const { label, name, phone, line1, line2, city, state, pincode, landmark } = req.body;

    // Validation
    if (!line1 || !city || !state || !pincode) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        message: 'Required fields: line1, city, state, pincode' 
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        message: 'User not found' 
      });
    }

    // Create new address
    const newAddress = {
      label: label || 'Home',
      name: name || '',
      phone: phone || '',
      line1,
      line2: line2 || '',
      city,
      state,
      pincode,
      landmark: landmark || '',
      isDefault: (user.addresses && user.addresses.length === 0) ? true : false // First address is default
    };

    // Add to addresses array
    if (!user.addresses) {
      user.addresses = [];
    }
    user.addresses.push(newAddress);

    await user.save();

    // Return the newly added address with all addresses
    const addedAddress = user.addresses[user.addresses.length - 1];

    res.status(HTTP_STATUS.CREATED).json({ 
      message: 'Address added successfully',
      address: addedAddress,
      addresses: user.addresses
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: 'Failed to add address',
      error: error.message 
    });
  }
};

/**
 * Update an address
 * PUT /address/:id
 */
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, name, phone, line1, line2, city, state, pincode, landmark } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        message: 'User not found' 
      });
    }

    // Find address
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === id
    );

    if (addressIndex === -1) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        message: 'Address not found' 
      });
    }

    // Update address fields
    if (line1) user.addresses[addressIndex].line1 = line1;
    if (line2) user.addresses[addressIndex].line2 = line2;
    if (name) user.addresses[addressIndex].name = name;
    if (phone) user.addresses[addressIndex].phone = phone;
    if (city) user.addresses[addressIndex].city = city;
    if (state) user.addresses[addressIndex].state = state;
    if (pincode) user.addresses[addressIndex].pincode = pincode;
    if (label) user.addresses[addressIndex].label = label;
    if (landmark !== undefined) user.addresses[addressIndex].landmark = landmark;

    await user.save();

    res.json({ 
      message: 'Address updated successfully',
      address: user.addresses[addressIndex],
      addresses: user.addresses
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: 'Failed to update address',
      error: error.message 
    });
  }
};

/**
 * Delete an address
 * DELETE /address/:id
 */
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        message: 'User not found' 
      });
    }

    // Find and remove address
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === id
    );

    if (addressIndex === -1) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        message: 'Address not found' 
      });
    }

    const deletedAddress = user.addresses[addressIndex];
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default and there are other addresses, set first as default
    if (deletedAddress.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({ 
      message: 'Address deleted successfully',
      addresses: user.addresses 
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: 'Failed to delete address',
      error: error.message 
    });
  }
};

/**
 * Set an address as default
 * PUT /address/default/:id
 */
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        message: 'User not found' 
      });
    }

    // Find the address to set as default
    const targetAddressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === id
    );

    if (targetAddressIndex === -1) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ 
        message: 'Address not found' 
      });
    }

    // Remove default from all addresses
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });

    // Set target address as default
    user.addresses[targetAddressIndex].isDefault = true;

    await user.save();

    res.json({ 
      message: 'Default address updated',
      address: user.addresses[targetAddressIndex],
      addresses: user.addresses 
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: 'Failed to set default address',
      error: error.message 
    });
  }
};
