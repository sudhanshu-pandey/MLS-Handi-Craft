import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import CartItem from "../models/cartitem.model.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * Helper function to find product by ID
 * Works with MongoDB ObjectId
 */
const findProductById = async (productId) => {
  try {
    // MongoDB ObjectId lookup
    const product = await Product.findById(productId);
    if (product) {
      console.log(`✅ [findProductById] Found product: ${product.name}`);
      return product;
    }
    
    console.warn(`⚠️ [findProductById] Product not found for ID: ${productId}`);
    return null;
  } catch (err) {
    console.error(`❌ [findProductById] Error:`, err.message);
    return null;
  }
};

/**
 * Transform CartItem from DB format to Client format
 * Converts MongoDB documents to simple objects the client expects
 */
const formatCartItem = (cartItem) => {
  return {
    productId: cartItem.productId?.toString() || cartItem.productId,
    quantity: cartItem.quantity,
    productName: cartItem.product?.name || '',
    productPrice: cartItem.product?.price || 0,
    productImage: cartItem.product?.image || '',
  };
};

/**
 * Transform array of CartItems to client format
 */
const formatCartItems = (cartItems) => {
  return cartItems.map(item => formatCartItem(item));
};

// Add product to cart
const addToCart = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.warn('❌ [addToCart] User not authenticated');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Product ID and quantity are required.' });
    }

    // Find product using helper function
    const product = await findProductById(productId);
    if (!product) {
      console.warn(`❌ [addToCart] Product not found: ${productId}`);
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Product not found.' });
    }

    console.log(`✅ [addToCart] User: ${userId}, Product: ${productId}, Quantity: ${quantity}`);

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      userId,
      productId,
      savedForLater: false
    });

    if (cartItem) {
      // Update existing item
      console.log(`📝 [addToCart] Updating existing cart item, old qty: ${cartItem.quantity}`);
      cartItem.quantity += quantity;
      cartItem.updatedAt = new Date();
      await cartItem.save();
      console.log(`✅ [addToCart] Cart item updated, new qty: ${cartItem.quantity}`);
    } else {
      // Create new cart item
      console.log(`➕ [addToCart] Creating new cart item`);
      cartItem = new CartItem({
        userId,
        productId,
        product: product._id,
        quantity,
        savedForLater: false
      });
      await cartItem.save();
      console.log(`✅ [addToCart] New cart item created`);
    }

    // Return full cart (like updateCartQuantity does) to keep client in sync
    const cartItems = await CartItem.find({ userId }).populate('product');
    const activeCart = cartItems.filter(item => !item.savedForLater);
    const savedItems = cartItems.filter(item => item.savedForLater);

    // Format cart items for client
    const formattedCart = formatCartItems(activeCart);
    const formattedSavedItems = formatCartItems(savedItems);

    res.status(HTTP_STATUS.CREATED).json({ 
      message: 'Product added to cart.',
      cart: formattedCart,
      savedItems: formattedSavedItems,
      itemCount: activeCart.length,
      savedCount: savedItems.length
    });
  } catch (err) {
    console.error('❌ [addToCart] Error:', err);
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

    // Format cart items for client
    const formattedCart = formatCartItems(activeCart);
    const formattedSavedItems = formatCartItems(savedItems);

    res.json({ 
      cart: formattedCart, 
      savedItems: formattedSavedItems, 
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

    // Format cart items for client
    const formattedCart = formatCartItems(activeCart);
    const formattedSavedItems = formatCartItems(savedItems);

    res.json({ 
      message: 'Cart updated.',
      cart: formattedCart,
      savedItems: formattedSavedItems,
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

    // Format cart items for client
    const formattedCart = formatCartItems(activeCart);
    const formattedSavedItems = formatCartItems(savedItems);

    res.json({ 
      message: 'Cart item updated.',
      cart: formattedCart,
      savedItems: formattedSavedItems,
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

    // Format cart items for client
    const formattedCart = formatCartItems(activeCart);
    const formattedSavedItems = formatCartItems(savedItems);

    res.json({ 
      message: 'Product removed from cart.',
      cart: formattedCart,
      savedItems: formattedSavedItems,
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

      // Find product using helper function
      const product = await findProductById(productId);
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
