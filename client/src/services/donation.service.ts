import api from './api'

export interface DonationOrderRequest {
  amount: number
  donorName: string
  donorEmail: string
  message?: string
}

export interface DonationVerifyRequest {
  razorpayPaymentId: string
  razorpayOrderId: string
  razorpaySignature: string
  donorName: string
  donorEmail: string
  amount: number
  message?: string
  inMemory?: boolean
  memoryName?: string
  wantsReceipt?: boolean
}

class DonationService {
  /**
   * Create donation order on backend
   */
  async createDonationOrder(request: DonationOrderRequest) {
    try {
      const response = await api.request('/donations/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify(request),
      })
      return response
    } catch (error) {
      console.error('Error creating donation order:', error)
      throw error
    }
  }

  /**
   * Verify donation payment
   */
  async verifyDonationPayment(verifyData: DonationVerifyRequest) {
    try {
      const response = await api.request('/donations/razorpay/verify', {
        method: 'POST',
        body: JSON.stringify(verifyData),
      })
      return response
    } catch (error) {
      console.error('Error verifying donation payment:', error)
      throw error
    }
  }

  /**
   * Get user's donation history
   */
  async getUserDonations() {
    try {
      const response = await api.request('/donations/my-donations', {
        method: 'GET',
      })
      return response
    } catch (error) {
      console.error('Error fetching user donations:', error)
      throw error
    }
  }

  /**
   * Get public donation statistics
   */
  async getDonationStats() {
    try {
      const response = await api.request('/donations/stats', {
        method: 'GET',
      })
      return response
    } catch (error) {
      console.error('Error fetching donation stats:', error)
      throw error
    }
  }
}

export default new DonationService()
