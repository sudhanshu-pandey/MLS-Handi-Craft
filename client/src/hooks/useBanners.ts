import { useCallback, useEffect, useState } from 'react';
import { bannerService, Banner } from '../services/banner.service';

interface UseBannersReturn {
  banners: Banner[];
  loading: boolean;
  error: string | null;
  loadBanners: () => Promise<void>;
}

export const useBanners = (): UseBannersReturn => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bannerService.getAllBanners();
      setBanners(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load banners';
      setError(errorMessage);
      console.error('Error loading banners:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  return { banners, loading, error, loadBanners };
};

export default useBanners;
