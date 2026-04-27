import Banner from '../models/banner.model.js';
import { HTTP_STATUS } from '../config/constants.js';

// Get all active banners sorted by order
const getAllBanners = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const filter = includeInactive ? {} : { active: true };
    const banners = await Banner.find(filter).sort({ order: 1 });

    if (!banners || banners.length === 0) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        count: 0,
        data: [],
        message: 'No banners found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching banners',
      error: error.message,
    });
  }
};

// Get single banner by ID
const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Banner not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching banner',
      error: error.message,
    });
  }
};

// Create new banner (Admin)
const createBanner = async (req, res) => {
  try {
    const {
      title,
      description,
      subtitle,
      image,
      link,
      buttonText,
      order,
      active,
      isActive,
    } = req.body;

    const normalizedDescription = description || subtitle || title;
    const normalizedActive = typeof active === 'boolean'
      ? active
      : (typeof isActive === 'boolean' ? isActive : undefined);

    const banner = new Banner({
      title,
      description: normalizedDescription,
      image,
      link,
      buttonText,
      order,
      ...(typeof normalizedActive === 'boolean' ? { active: normalizedActive } : {}),
    });

    await banner.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Banner created successfully',
      data: banner,
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Error creating banner',
      error: error.message,
    });
  }
};

// Update banner (Admin)
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      subtitle,
      image,
      link,
      buttonText,
      order,
      active,
      isActive,
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (image !== undefined) updateData.image = image;
    if (link !== undefined) updateData.link = link;
    if (buttonText !== undefined) updateData.buttonText = buttonText;
    if (order !== undefined) updateData.order = order;

    if (description !== undefined || subtitle !== undefined) {
      updateData.description = description || subtitle;
    }

    if (typeof active === 'boolean') {
      updateData.active = active;
    } else if (typeof isActive === 'boolean') {
      updateData.active = isActive;
    }

    const banner = await Banner.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Banner not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Banner updated successfully',
      data: banner,
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Error updating banner',
      error: error.message,
    });
  }
};

// Delete banner (Admin)
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Banner not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error deleting banner',
      error: error.message,
    });
  }
};

export default {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
};
