import api from './api';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
  active: boolean;
}

class CategoryService {
  /**
   * Get all active categories from the backend
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await api.request('/categories');
      return response.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Get a specific category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await api.request(`/categories/slug/${slug}`);
      return response.category || null;
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      return null;
    }
  }
}

export default new CategoryService();
