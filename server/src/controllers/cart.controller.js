import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import CartItem from "../models/cartitem.model.js";
import { HTTP_STATUS } from "../config/constants.js";

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Product ID and quantity are required.' });
    }

    // Find product by numeric ID
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Product not found.' });
    }

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      userId,
      productId,
      savedForLater: false
    });

    if (cartItem) {
      // Update existing item
      cartItem.quantity += quantity;
      cartItem.updatedAt = new Date();
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = new CartItem({
        userId,
        productId,
        product: product._id,
        quantity,
        savedForLater: false
      });
      await cartItem.save();
    }

    res.status(HTTP_STATUS.CREATED).json({ 
      message: 'Product added to cart.',
      cartItem 
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all cart items for this user
    const cartItems = await CartItem.find({ userId }).populate('product');
    
    if (!cartItems || cartItems.length === 0) {
      return res.json({ 
        cart: [], 
        savedItems: [], 
        total: 0, 
        itemCount: 0,
        savedCount: 0
      });
    }

    const activeCart = cartItems.filter(item => !item.savedForLater);
    const savedItems = cartItems.filter(item => item.savedForLater);
    const total = activeCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    res.json({ 
      cart: activeCart, 
      savedItems, 
      total, 
      itemCount: activeCart.length,
      savedCount: savedItems.length
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Update cart item quantity
const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Product ID and quantity are required.' });
    }

    const cartItem = await CartItem.findOne({ userId, productId }).populate('product');
    if (!cartItem) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Product not in cart.' });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await CartItem.deleteOne({ _id: cartItem._id });
    } else {
      cartItem.quantity = quantity;
      cartItem.updatedAt = new Date();
      await cartItem.save();
    }

    // Return updated cart
    const cartItems = await CartItem.find({ userId }).populate('product');
    const activeCart = cartItems.filter(item => !item.savedForLater);
    const savedItems = cartItems.filter(item => item.savedForLater);

    res.json({ 
      message: 'Cart updated.',
      cart: activeCart,
      savedItems,
      itemCount: activeCart.length,
      savedCount: savedItems.length
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Toggle save for later
const toggleSaveForLater = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, savedForLater } = req.body;

    if (!productId || savedForLater === undefined) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Product ID and savedForLater flag are required.' });
    }

    const cartItem = await CartItem.findOne({ userId, productId }).populate('product');
    if (!cartItem) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Product not in cart.' });
    }

    cartItem.savedForLater = savedForLater;
    cartItem.updatedAt = new Date();
    await cartItem.save();

    // Return updated cart
    const cartItems = await CartItem.find({ userId }).populate('product');
    const activeCart = cartItems.filter(item => !item.savedForLater);
    const savedItems = cartItems.filter(item => item.savedForLater);

    res.json({ 
      message: 'Cart item updated.',
      cart: activeCart,
      savedItems,
      itemCount: activeCart.length,
      savedCount: savedItems.length
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Remove product from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cartItem = await CartItem.findOne({ userId, productId });
    if (!cartItem) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Product not in cart.' });
    }

    await CartItem.deleteOne({ _id: cartItem._id });

    // Return updated cart
    const cartItems = await CartItem.find({ userId }).populate('product');
    const activeCart = cartItems.filter(item => !item.savedForLater);
    const savedItems = cartItems.filter(item => item.savedForLater);

    res.json({ 
      message: 'Product removed from cart.',
      cart: activeCart,
      savedItems,
      itemCount: activeCart.length,
      savedCount: savedItems.length
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await CartItem.deleteMany({ userId });

    res.json({ 
      message: 'Cart cleared.',
      cart: [] 
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Sync guest cart with user cart (called on login)
const syncCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Items must be an array.' });
    }

    // Clear existing cart for this user
    await CartItem.deleteMany({ userId });

    // Add all guest cart items
    for (const guestItem of items) {
      const { productId, quantity, savedForLater } = guestItem;

      if (!productId || !quantity) {
        continue; // Skip invalid items
      }

      // Find product by numeric ID
      const product = await Product.findOne({ id: productId });
      if (!product) {
        continue; // Skip if product doesn't exist
      }

      // Create cart item
      await CartItem.create({
        userId,
        productId,
        product: product._id,
        quantity,
        savedForLater: savedForLater || false
      });
    }

    // Return synced cart
    const cartItems = await CartItem.find({ userId }).populate('product');
    const activeCart = cartItems.filter(item => !item.savedForLater);
    const savedItems = cartItems.filter(item => item.savedForLater);
    const total = activeCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    res.json({
      message: 'Cart synced successfully.',
      cart: activeCart,
      savedItems,
      total,
      itemCount: activeCart.length,
      savedCount: savedItems.length,
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

export default {
  addToCart,
  getCart,
  updateCartQuantity,
  toggleSaveForLater,
  removeFromCart,
  clearCart,
  syncCart,
};
