const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Review {
  _id: string;
  product: string;
  user: {
    _id: string;
    name: string;
    phone: string;
  };
  name: string;
  rating: number;
  comment: string;
  images: string[];
  helpful: number;
  unhelpful: number;
  createdAt: string;
  updatedAt: string;
}

export const reviewService = {
  // Get all reviews for a specific product
  async getProductReviews(productId: string, sort: 'latest' | 'highest' = 'latest') {
    try {
      const response = await fetch(`${baseURL}/reviews/${productId}?sort=${sort}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },

  // Add a new review
  async addReview(productId: string, reviewData: {
    rating: number;
    comment: string;
    name: string;
    images?: string[];
  }) {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${baseURL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          ...reviewData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add review');
      }

      const data = await response.json();
      return data.review;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  // Delete a review
  async deleteReview(reviewId: string) {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${baseURL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },
};
