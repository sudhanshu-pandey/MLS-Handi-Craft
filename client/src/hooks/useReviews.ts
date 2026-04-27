import { useCallback, useEffect, useState } from 'react';
import { reviewService, Review } from '../services/review.service';

export const useReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'latest' | 'highest'>('latest');

  // Load reviews from backend
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewService.getProductReviews(productId, sortType);
      setReviews(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load reviews';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [productId, sortType]);

  // Load reviews on mount or when productId/sortType changes
  useEffect(() => {
    if (productId) {
      loadReviews();
    }
  }, [productId, sortType, loadReviews]);

  // Add a new review
  const addReview = useCallback(
    async (reviewData: { rating: number; comment: string; name: string; images?: string[] }) => {
      try {
        const newReview = await reviewService.addReview(productId, reviewData);
        setReviews((prev) => [newReview, ...prev]);
        return newReview;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add review';
        setError(message);
        throw err;
      }
    },
    [productId]
  );

  // Delete a review
  const deleteReview = useCallback(async (reviewId: string) => {
    try {
      await reviewService.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete review';
      setError(message);
      throw err;
    }
  }, []);

  return {
    reviews,
    loading,
    error,
    sortType,
    setSortType,
    addReview,
    deleteReview,
    loadReviews,
  };
};

export default useReviews;
