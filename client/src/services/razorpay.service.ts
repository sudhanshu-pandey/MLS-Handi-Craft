import api from './api';

export interface RazorpayOrderResponse {
  razorpayOrder: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
  keyId: string;
}

export interface RazorpayVerifyRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

class RazorpayService {
  /**
   * Create a Razorpay order
   */
  async createOrder(amount: number, orderId: string, currency: string = 'INR'): Promise<RazorpayOrderResponse> {
    try {
      console.log("Creating Razorpay order on client with:", { amount, orderId, currency });
      const response = await api.request('/payments/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount, orderId, currency }),
      });
      console.log("Razorpay order created successfully:", response);
      return response;
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment
   */
  async verifyPayment(verifyData: RazorpayVerifyRequest) {
    return api.request('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(verifyData),
    });
  }

  /**
   * Load Razorpay script
   */
  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if script is already loaded
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('Failed to load Razorpay script, but it may still work');
        resolve(true); // Continue even if script load fails
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Open Razorpay checkout
   */
  openCheckout(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const razorpay = (window as any).Razorpay;
      if (!razorpay) {
        reject(new Error('Razorpay script not loaded'));
        return;
      }

      const checkout = new razorpay({
        ...options,
        handler: (response: any) => {
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment declined. Please try again.'));
          },
        },
      });

      checkout.open();
    });
  }
}

export default new RazorpayService();
