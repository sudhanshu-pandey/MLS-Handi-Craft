interface Banner {
  _id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  buttonText: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const bannerService = {
  async getAllBanners(): Promise<Banner[]> {
    try {
      const response = await fetch(`${baseURL}/banners`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching banners:', error);
      return [];
    }
  },

  async getBannerById(id: string): Promise<Banner | null> {
    try {
      const response = await fetch(`${baseURL}/banners/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching banner:', error);
      return null;
    }
  },

  async createBanner(bannerData: Partial<Banner>): Promise<Banner | null> {
    try {
      const response = await fetch(`${baseURL}/banners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error creating banner:', error);
      return null;
    }
  },

  async updateBanner(id: string, bannerData: Partial<Banner>): Promise<Banner | null> {
    try {
      const response = await fetch(`${baseURL}/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error updating banner:', error);
      return null;
    }
  },

  async deleteBanner(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseURL}/banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting banner:', error);
      return false;
    }
  },
};

export type { Banner };
