/**
 * Pincode Controller
 * Handles pincode lookups and delivery estimates
 */

const PINCODE_API_URL = 'https://api.postalpincode.in/pincode';
const DELIVERY_DAYS_MAPPING = {
  'Delhi': { min: 1, max: 2 },
  'NCR': { min: 1, max: 2 },
  'Mumbai': { min: 2, max: 3 },
  'Bangalore': { min: 2, max: 3 },
  'Hyderabad': { min: 2, max: 3 },
  'Chennai': { min: 3, max: 4 },
  'Kolkata': { min: 3, max: 4 },
  'Pune': { min: 2, max: 3 },
  'Chandigarh': { min: 1, max: 2 },
  'Ahmedabad': { min: 2, max: 3 },
};

/**
 * Lookup city and delivery estimate by pincode
 * GET /api/pincode/lookup/:pincode
 */
export const lookupPincode = async (req, res) => {
  try {
    const { pincode } = req.params;

    // Validate pincode format
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Please provide a 6-digit pincode.',
      });
    }

    // Fetch data from external API
    const response = await fetch(`${PINCODE_API_URL}/${pincode}`);
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: 'Failed to fetch pincode data',
      });
    }

    const data = await response.json();

    // Check if pincode exists
    if (!Array.isArray(data) || data.length === 0 || data[0].Status === 'Error') {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found',
      });
    }

    const pincodeData = data[0];

    if (!pincodeData.PostOffice || pincodeData.PostOffice.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'City information not available for this pincode',
      });
    }

    // Extract city/district information
    const postOffice = pincodeData.PostOffice[0];
    const district = postOffice.District || 'Unknown';
    const state = postOffice.State || 'Unknown';
    const region = postOffice.Region || 'Unknown';

    // Determine delivery estimate based on city/state
    const deliveryEstimate = getDeliveryEstimate(district, state, region);

    res.json({
      success: true,
      data: {
        pincode,
        city: district,
        state,
        region,
        postOffices: pincodeData.PostOffice.map(office => ({
          name: office.Name,
          district: office.District,
          state: office.State,
          region: office.Region,
        })),
        deliveryEstimate: {
          minDays: deliveryEstimate.min,
          maxDays: deliveryEstimate.max,
          estimatedDelivery: `${deliveryEstimate.min}-${deliveryEstimate.max} business days`,
          deliveryCharge: calculateDeliveryCharge(deliveryEstimate),
        },
      },
    });
  } catch (error) {
    console.error('Pincode lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while looking up pincode',
      error: error.message,
    });
  }
};

/**
 * Get delivery estimate for a city
 */
const getDeliveryEstimate = (district, state, region) => {
  // Try to match by district/city name
  for (const [city, estimate] of Object.entries(DELIVERY_DAYS_MAPPING)) {
    if (district.toLowerCase().includes(city.toLowerCase()) || 
        region.toLowerCase().includes(city.toLowerCase())) {
      return estimate;
    }
  }

  // Default delivery estimate based on state
  const stateKey = state.toLowerCase();
  if (stateKey.includes('delhi') || stateKey.includes('ncr')) {
    return { min: 1, max: 2 };
  } else if (
    stateKey.includes('maharashtra') ||
    stateKey.includes('karnataka') ||
    stateKey.includes('telangana') ||
    stateKey.includes('tamil') ||
    stateKey.includes('gujarat') ||
    stateKey.includes('punjab')
  ) {
    return { min: 2, max: 3 };
  } else {
    return { min: 3, max: 5 }; // Default for remote areas
  }
};

/**
 * Calculate delivery charge based on delivery days
 */
const calculateDeliveryCharge = (deliveryEstimate) => {
  // Free delivery for 1-2 days (metro areas)
  if (deliveryEstimate.max <= 2) {
    return { amount: 0, status: 'Free' };
  }
  // ₹50 for 2-3 days
  else if (deliveryEstimate.max <= 3) {
    return { amount: 50, status: 'Discounted' };
  }
  // ₹100 for 3-4 days
  else if (deliveryEstimate.max <= 4) {
    return { amount: 100, status: 'Standard' };
  }
  // ₹150 for 5+ days (remote areas)
  else {
    return { amount: 150, status: 'Remote' };
  }
};

/**
 * Bulk pincode lookup (for prefetching)
 * POST /api/pincode/bulk
 */
export const bulkPincodeLookup = async (req, res) => {
  try {
    const { pincodes } = req.body;

    if (!Array.isArray(pincodes) || pincodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pincodes array is required',
      });
    }

    if (pincodes.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 pincodes can be looked up at once',
      });
    }

    const results = await Promise.all(
      pincodes.map(pincode => fetchPincodeData(pincode))
    );

    const successfulResults = results.filter(r => r.success);

    res.json({
      success: true,
      total: pincodes.length,
      successful: successfulResults.length,
      failed: pincodes.length - successfulResults.length,
      data: successfulResults,
    });
  } catch (error) {
    console.error('Bulk pincode lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk pincode lookup',
      error: error.message,
    });
  }
};

/**
 * Helper function to fetch pincode data
 */
const fetchPincodeData = async (pincode) => {
  try {
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return {
        success: false,
        pincode,
        message: 'Invalid pincode format',
      };
    }

    const response = await fetch(`${PINCODE_API_URL}/${pincode}`);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0 || data[0].Status === 'Error') {
      return {
        success: false,
        pincode,
        message: 'Pincode not found',
      };
    }

    const pincodeData = data[0];
    const postOffice = pincodeData.PostOffice?.[0];

    if (!postOffice) {
      return {
        success: false,
        pincode,
        message: 'City information not available',
      };
    }

    const district = postOffice.District || 'Unknown';
    const state = postOffice.State || 'Unknown';
    const region = postOffice.Region || 'Unknown';
    const deliveryEstimate = getDeliveryEstimate(district, state, region);

    return {
      success: true,
      pincode,
      city: district,
      state,
      region,
      deliveryEstimate: {
        minDays: deliveryEstimate.min,
        maxDays: deliveryEstimate.max,
        estimatedDelivery: `${deliveryEstimate.min}-${deliveryEstimate.max} business days`,
        deliveryCharge: calculateDeliveryCharge(deliveryEstimate),
      },
    };
  } catch (error) {
    return {
      success: false,
      pincode,
      message: error.message,
    };
  }
};
