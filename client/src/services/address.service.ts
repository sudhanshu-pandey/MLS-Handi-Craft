import api from './api';

/**
 * Address Service
 * Handles all address-related API calls
 */

export const addressService = {
  /**
   * Get all addresses for the logged-in user
   */
  async getAddresses() {
    try {
      const response = await api.request('/address');
      return {
        success: true,
        addresses: response.addresses || [],
        count: response.count || 0,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch addresses',
        addresses: [],
        count: 0,
      };
    }
  },

  /**
   * Add a new address
   */
  async addAddress(addressData: any) {
    try {
      const response = await api.request('/address', {
        method: 'POST',
        body: JSON.stringify(addressData),
      });
      return {
        success: true,
        address: response.address,
        addresses: response.addresses || [response.address],
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add address',
      };
    }
  },

  /**
   * Update an address
   */
  async updateAddress(addressId: string, addressData: any) {
    try {
      const response = await api.request(`/address/${addressId}`, {
        method: 'PUT',
        body: JSON.stringify(addressData),
      });
      return {
        success: true,
        address: response.address,
        addresses: response.addresses || [response.address],
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update address',
      };
    }
  },

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string) {
    try {
      const response = await api.request(`/address/${addressId}`, {
        method: 'DELETE',
      });
      return {
        success: true,
        addresses: response.addresses || [],
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete address',
      };
    }
  },

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId: string) {
    try {
      const response = await api.request(`/address/default/${addressId}`, {
        method: 'PUT',
      });
      return {
        success: true,
        address: response.address,
        addresses: response.addresses || [],
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to set default address',
      };
    }
  },
};

export default addressService;
