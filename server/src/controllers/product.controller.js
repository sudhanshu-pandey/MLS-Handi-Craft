
import Product from "../models/product.model.js";
import { HTTP_STATUS } from "../config/constants.js";

// Get all products (with pagination & sorting)
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'desc' ? -1 : 1;
    
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments();
    
    const products = await Product.find()
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit);
    
    res.json({ 
      products, 
      total, 
      page, 
      pages: Math.ceil(total / limit),
      limit 
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Product not found" });
    res.json({ product });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Search products by name or description
const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Query parameter is required" });
    const regex = new RegExp(query, "i");
    const products = await Product.find({
      $or: [
        { name: regex },
        { description: regex }
      ]
    });
    res.json({ products, total: products.length });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const total = await Product.countDocuments({ category });
    const products = await Product.find({ category })
      .skip(skip)
      .limit(limit);
    
    res.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Filter products (advanced)
const filterProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, rating, inStock, sortBy, order } = req.body;
    
    let query = {};
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }
    if (rating) query.rating = { $gte: rating };
    if (inStock !== undefined) query.stock = { $gt: inStock ? 0 : undefined };
    
    const sort = sortBy || 'createdAt';
    const sortOrder = order === 'desc' ? -1 : 1;
    
    const products = await Product.find(query).sort({ [sort]: sortOrder });
    
    res.json({ products, total: products.length });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Create product (admin only)
const createProduct = async (req, res) => {
  try {
    const { name, price, originalPrice, category, description, image, images, stock, artisan, artisanInfo, specifications, tags } = req.body;
    if (!name || !price || !category) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Name, price, and category are required' });
    }
    
    // Use first image from images array if no single image provided
    const mainImage = image || (images && images.length > 0 ? images[0] : null);
    
    const product = new Product({
      name,
      price,
      originalPrice,
      category,
      description,
      image: mainImage,
      images: images || [],
      stock: stock || 50,
      artisanInfo: artisan || artisanInfo || {},
      specifications: specifications || {},
      tags: tags || []
    });
    await product.save();
    
    res.status(HTTP_STATUS.CREATED).json({ message: 'Product created', product });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
  try {
    const { artisan, images, ...otherFields } = req.body;
    
    const updateData = {
      ...otherFields,
      artisanInfo: artisan || req.body.artisanInfo,
      images: images || [],
    };
    
    // Update image to first in array if images provided
    if (images && images.length > 0 && !updateData.image) {
      updateData.image = images[0];
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );
    if (!product) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Product not found' });
    
    res.json({ message: 'Product updated', product });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Delete product (admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Product not found' });
    
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: err.message });
  }
};

// Update stock for multiple products (after order placement)
const updateStock = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid items array' });
    }

    // Update stock for each item
    const updates = [];
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity) {
        continue;
      }

      try {
        // Find product by id or _id
        // Try to find by _id first (most common case)
        let product = null;
        
        try {
          // Try to find by MongoDB ObjectId (_id field)
          product = await Product.findById(productId);
        } catch (err) {
          // ObjectId parse failed, will try numeric id
        }
        
        // If not found by _id, try to find by numeric id field
        if (!product) {
          product = await Product.findOne({ id: productId });
        }
        
        if (!product) {
          continue;
        }

        const previousStock = product.stock || 0;
        const newStock = Math.max(0, previousStock - quantity);

        // Update product stock
        await Product.findByIdAndUpdate(
          product._id,
          { stock: newStock },
          { returnDocument: 'after' }
        );

        updates.push({
          productId,
          previousStock,
          newStock,
          quantitySold: quantity
        });
      } catch (error) {
        // Stock update error
      }
    }

    res.json({
      message: 'Stock updated successfully',
      updates,
      totalUpdated: updates.length
    });
  } catch (err) {
    // Stock update error
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to update stock',
      error: err.message
    });
  }
};

export default {
  getAllProducts,
  getProductById,
  searchProducts,
  getProductsByCategory,
  filterProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock
};
