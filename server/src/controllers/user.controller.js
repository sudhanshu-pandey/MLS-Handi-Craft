import User from "../models/user.model.js";
import { HTTP_STATUS } from "../config/constants.js";

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-otp -otpExpires -refreshTokens");
    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};


// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, gender, dob } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    if (name) user.name = name;
    if (email) user.email = email;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Add address
const addAddress = async (req, res) => {
  try {
    const address = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    user.addresses.push(address);
    await user.save();
    res.status(HTTP_STATUS.CREATED).json({ address: user.addresses[user.addresses.length - 1], addresses: user.addresses });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const update = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    
    const addrIndex = user.addresses.findIndex(a => a._id.toString() === addressId);
    if (addrIndex === -1) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Address not found" });
    
    user.addresses[addrIndex] = { ...user.addresses[addrIndex].toObject(), ...update };
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// List addresses
const listAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    res.json({ addresses: user.addresses });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Admin: get all users
const getAllUsersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = (req.query.search || "").trim();
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-otp -otpExpires -refreshToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Admin: get user by id
const getUserByIdAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-otp -otpExpires -refreshToken");
    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Admin: block user
const blockUserAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBlocked: true },
      { returnDocument: "after", runValidators: true }
    ).select("-otp -otpExpires -refreshToken");

    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    res.json({ message: "User blocked", user });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Admin: unblock user
const unblockUserAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBlocked: false },
      { returnDocument: "after", runValidators: true }
    ).select("-otp -otpExpires -refreshToken");

    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    res.json({ message: "User unblocked", user });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

export default {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  listAddresses,
  getAllUsersAdmin,
  getUserByIdAdmin,
  blockUserAdmin,
  unblockUserAdmin
};
