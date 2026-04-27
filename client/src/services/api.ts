interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

const REQUEST_TIMEOUT = 30000; // 30 seconds

class APIClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshQueue: ((token: string) => void)[] = [];

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }

  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  setToken(token: string): void {
    if (token) {
      localStorage.setItem('accessToken', token);
    }
  }

  setRefreshToken(refreshToken: string): void {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  clearToken(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
    );
  }

  private addToRefreshQueue(callback: (token: string) => void): void {
    this.refreshQueue.push(callback);
  }

  private processRefreshQueue(token: string): void {
    this.refreshQueue.forEach(callback => callback(token));
    this.refreshQueue = [];
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      // If already refreshing, queue the request
      return new Promise((resolve) => {
        this.addToRefreshQueue((token: string) => {
          resolve(token);
        });
      });
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearToken();
      throw new Error('Session expired. Please login again.');
    }

    this.isRefreshing = true;

    try {
      const url = `${this.baseURL}/auth/refresh`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearToken();
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const newAccessToken = data.accessToken;

      this.setToken(newAccessToken);
      this.isRefreshing = false;
      this.processRefreshQueue(newAccessToken);

      return newAccessToken;
    } catch (error) {
      this.isRefreshing = false;
      this.clearToken();
      throw error;
    }
  }

  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const fetchPromise = fetch(url, {
        ...options,
        headers,
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, this.createTimeoutPromise()]);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        try {
          const newAccessToken = await this.refreshAccessToken();
          
          // Retry the original request with new token
          const retryHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
          };

          if (newAccessToken) {
            retryHeaders['Authorization'] = `Bearer ${newAccessToken}`;
          }

          const retryFetchPromise = fetch(url, {
            ...options,
            headers: retryHeaders,
          });

          const retryResponse = await Promise.race([retryFetchPromise, this.createTimeoutPromise()]);

          if (!retryResponse.ok) {
            const error = await retryResponse.json().catch(() => ({}));
            throw new Error(error.message || `HTTP ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth endpoints
  sendOTP(phone: string) {
    const payload = { phone };
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  verifyOTP(phone: string, otp: string) {
    const response = this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    
    // Store both tokens after successful OTP verification
    return response.then((data: any) => {
      if (data.accessToken) {
        this.setToken(data.accessToken);
      }
      if (data.refreshToken) {
        this.setRefreshToken(data.refreshToken);
      }
      return data;
    });
  }

  logout() {
    const refreshToken = this.getRefreshToken();
    return this.request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) })
      .finally(() => {
        this.clearToken();
      });
  }

  // Products endpoints
  getProducts(page = 1, limit = 20) {
    return this.request(`/products?page=${page}&limit=${limit}`);
  }

  getProductById(id: string | number) {
    return this.request(`/products/${id}`);
  }

  searchProducts(query: string) {
    return this.request(`/products/search?query=${encodeURIComponent(query)}`);
  }

  filterProducts(filters: any) {
    return this.request('/products/filter', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  }

  getCategories() {
    return this.request('/categories');
  }

  getProductsByCategory(category: string) {
    return this.request(`/products/category/${category}`);
  }

  // Reviews endpoints
  getProductReviews(productId: string | number, sort = 'latest') {
    return this.request(`/products/${productId}/reviews?sort=${sort}`);
  }

  addProductReview(productId: string | number, review: any) {
    return this.request(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }

  // Cart endpoints
  getCart() {
    return this.request('/cart');
  }

  addToCart(productId: string | number, quantity: number) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  updateCartQuantity(productId: string | number, quantity: number) {
    return this.request('/cart', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  toggleSaveForLater(productId: string | number, savedForLater: boolean) {
    return this.request('/cart/save-for-later', {
      method: 'POST',
      body: JSON.stringify({ productId, savedForLater }),
    });
  }

  removeFromCart(productId: string | number) {
    return this.request(`/cart/${productId}`, { method: 'DELETE' });
  }

  clearCart() {
    return this.request('/cart/clear', { method: 'POST' });
  }

  // Wishlist endpoints
  getWishlist() {
    return this.request('/wishlist');
  }

  addToWishlist(productId: string | number) {
    return this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  }

  removeFromWishlist(productId: string | number) {
    return this.request(`/wishlist/${productId}`, { method: 'DELETE' });
  }

  // User endpoints
  getUserProfile() {
    return this.request('/user/profile');
  }

  updateUserProfile(profile: any) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  getAddresses() {
    return this.request('/user/addresses');
  }

  addAddress(address: any) {
    return this.request('/user/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  }

  updateAddress(addressId: string, address: any) {
    return this.request(`/user/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    });
  }

  deleteAddress(addressId: string) {
    return this.request(`/user/addresses/${addressId}`, { method: 'DELETE' });
  }

  // Orders endpoints
  getOrders() {
    return this.request('/orders');
  }

  getOrderDetails(orderId: string) {
    return this.request(`/orders/${orderId}`);
  }

  cancelOrder(orderId: string) {
    return this.request(`/orders/${orderId}/cancel`, { method: 'POST' });
  }

  // Payment endpoints
  validateCoupon(couponCode: string, cartTotal: number) {
    return this.request('/payments/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ couponCode, cartTotal }),
    });
  }

  processPayment(paymentData: any) {
    return this.request('/payments/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  initializePayment(orderId: string, amount: number, paymentMethod: string) {
    return this.request('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount, paymentMethod }),
    });
  }

  // Pincode endpoints
  lookupPincode(pincode: string) {
    return this.request(`/pincode/lookup/${pincode}`);
  }

  bulkPincodeLookup(pincodes: string[]) {
    return this.request('/pincode/bulk', {
      method: 'POST',
      body: JSON.stringify({ pincodes }),
    });
  }

  verifyPayment(paymentId: string) {
    return this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
    });
  }
}

export default new APIClient();
