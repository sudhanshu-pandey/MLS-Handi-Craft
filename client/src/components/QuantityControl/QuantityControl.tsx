import React, { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addItem, updateQuantity, removeItem } from '../../store/slices/cartSlice';
import type { CartItem } from '../../store/slices/cartSlice';
import { getStockCount } from '../../utils/commerce';
import { useToast } from '../../context/ToastContext';
import styles from './QuantityControl.module.css';

interface QuantityControlProps {
  productId: number | string;
  initialQuantity?: number;
  stock?: number;  // Optional: use real stock from API if available
  productName?: string;
  productPrice?: number;
  productImage?: string;
  onQuantityChange?: (quantity: number) => void;
}

/**
 * QuantityControl Component
 * Professional cart quantity toggle UI
 * Shows "Add to Cart" button initially
 * On click, shows [-] quantity [+] controls
 * Uses Redux Toolkit for state management
 */
export const QuantityControl: React.FC<QuantityControlProps> = ({
  productId,
  initialQuantity = 0,
  stock,
  productName,
  productPrice,
  productImage,
  onQuantityChange,
}) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Use real stock from API if provided, otherwise calculate
  const stockCount = stock !== undefined ? stock : getStockCount(productId);

  // Get current quantity from Redux store
  const cartItem = cartItems.find((item: CartItem) => item.productId === productId);
  const currentQuantity = cartItem?.quantity || initialQuantity;
  // Item is "in cart" only if quantity > 0
  const isInCart = cartItem && cartItem.quantity > 0;

  // Add to cart
  const handleAddToCart = useCallback(() => {
    if (isLoading) return;
    
    // Check if stock is available
    if (stockCount <= 0) {
      showToast('❌ Out of stock', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      dispatch(addItem({ 
        productId, 
        quantity: 1,
        productName,
        productPrice,
        productImage
      }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onQuantityChange?.(1);
    } finally {
      setIsLoading(false);
    }
  }, [productId, stockCount, dispatch, onQuantityChange, showToast, productName, productPrice, productImage]);

  // Increment quantity
  const handleIncrement = useCallback(() => {
    if (isLoading) return;

    // Check if adding one more would exceed stock
    if (currentQuantity + 1 > stockCount) {
      showToast(`❌ Only ${stockCount} in stock`, 'error');
      return;
    }

    const newQuantity = currentQuantity + 1;
    setIsLoading(true);
    
    try {
      dispatch(updateQuantity({ productId, quantity: newQuantity }));
      onQuantityChange?.(newQuantity);
    } finally {
      setIsLoading(false);
    }
  }, [productId, currentQuantity, stockCount, dispatch, onQuantityChange, showToast]);

  // Decrement quantity
  const handleDecrement = useCallback(() => {
    if (isLoading) return;

    const newQuantity = currentQuantity - 1;
    setIsLoading(true);

    try {
      if (newQuantity <= 0) {
        dispatch(removeItem(productId));
      } else {
        dispatch(updateQuantity({ productId, quantity: newQuantity }));
      }
      onQuantityChange?.(newQuantity);
    } finally {
      setIsLoading(false);
    }
  }, [productId, currentQuantity, dispatch, onQuantityChange]);



  return (
    <div className={styles.container}>
      {/* Success Message */}
      {showSuccess && (
        <div className={styles.successMessage}>
          ✅ Added to cart
        </div>
      )}

      {/* If not in cart: Show "Add to Cart" button */}
      {!isInCart ? (
        <button
          onClick={handleAddToCart}
          disabled={isLoading || stockCount <= 0}
          className={`${styles.addButton} ${isLoading || stockCount <= 0 ? styles.disabled : ''}`}
          aria-label={stockCount <= 0 ? "Out of stock" : "Add item to cart"}
        >
          {stockCount <= 0 ? '📦 Out of Stock' : (isLoading ? '⏳ Adding...' : '🛒 Add to Cart')}
        </button>
      ) : (
        /* If in cart: Show quantity controls */
        <div className={styles.quantityControls}>
          {/* Decrement Button */}
          <button
            onClick={handleDecrement}
            disabled={isLoading}
            className={`${styles.controlButton} ${styles.decrementButton}`}
            aria-label="Decrease quantity"
            title="Decrease quantity"
          >
            −
          </button>

          {/* Quantity Display */}
          <div className={styles.quantityDisplay}>
            <span className={styles.quantity}>{currentQuantity}</span>
          </div>

          {/* Increment Button */}
          <button
            onClick={handleIncrement}
            disabled={isLoading}
            className={`${styles.controlButton} ${styles.incrementButton}`}
            aria-label="Increase quantity"
            title="Increase quantity"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default QuantityControl;
