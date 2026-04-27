import Coupon from "../models/coupon.model.js";

/**
 * Get all active coupons
 * GET /api/coupons
 */
export const getAllCoupons = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const filter = includeInactive ? {} : { isActive: true };
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching coupons",
      error: error.message,
    });
  }
};

/**
 * Verify and apply coupon
 * POST /api/coupons/verify
 * Body: { code: string, orderAmount: number }
 */
export const verifyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (orderAmount === undefined || orderAmount === null) {
      return res.status(400).json({
        success: false,
        message: "Order amount is required",
      });
    }

    // Find coupon by code
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found or expired",
      });
    }

    // Check if coupon has expired
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit exceeded",
      });
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount should be ₹${coupon.minOrderAmount}`,
      });
    }

    // Calculate discount
    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      discountAmount = Math.round(orderAmount * (coupon.discountValue / 100));

      // Apply max discount cap if exists
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === "fixed") {
      discountAmount = coupon.discountValue;
    }

    return res.status(200).json({
      success: true,
      message: "Coupon is valid",
      data: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        discountAmount: discountAmount,
        finalAmount: Math.max(0, orderAmount - discountAmount),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying coupon",
      error: error.message,
    });
  }
};

/**
 * Get coupon by code
 * GET /api/coupons/:code
 */
export const getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Check if expired
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    res.status(200).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching coupon",
      error: error.message,
    });
  }
};

/**
 * Create coupon (Admin only)
 * POST /api/coupons
 */
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      maxDiscount,
      usageLimit,
      usageCount,
      usedCount,
      expiryDate,
      applicableCategories,
      isActive,
    } = req.body;

    if (!code || !discountValue || !discountType) {
      return res.status(400).json({
        success: false,
        message: "Code, discount value, and discount type are required",
      });
    }

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: maxDiscountAmount ?? maxDiscount,
      usageLimit,
      ...(usageCount !== undefined ? { usageCount } : {}),
      ...(usedCount !== undefined && usageCount === undefined ? { usageCount: usedCount } : {}),
      expiryDate,
      applicableCategories: applicableCategories || [],
      isActive: typeof isActive === 'boolean' ? isActive : true,
    });

    await newCoupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: newCoupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating coupon",
      error: error.message,
    });
  }
};

/**
 * Update coupon (Admin only)
 * PUT /api/coupons/:id
 */
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      maxDiscount,
      maxDiscountAmount,
      usedCount,
      usageCount,
      ...rest
    } = req.body;

    const updateData = {
      ...rest,
      ...(maxDiscountAmount !== undefined ? { maxDiscountAmount } : {}),
      ...(maxDiscount !== undefined && maxDiscountAmount === undefined ? { maxDiscountAmount: maxDiscount } : {}),
      ...(usageCount !== undefined ? { usageCount } : {}),
      ...(usedCount !== undefined && usageCount === undefined ? { usageCount: usedCount } : {}),
      updatedAt: new Date(),
    };

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating coupon",
      error: error.message,
    });
  }
};

/**
 * Delete coupon (Admin only)
 * DELETE /api/coupons/:id
 */
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting coupon",
      error: error.message,
    });
  }
};
