import React, { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addItem, updateQuantity, removeItem, syncCart } from '../../store/slices/cartSlice';
import type { CartItem } from '../../store/slices/cartSlice';
import { getStockCount } from '../../utils/commerce';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
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
  const { isLoggedIn } = useAuth();
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
    
    // Check if user is logged in
    if (!isLoggedIn) {
      showToast('❌ Please login to add items to cart', 'error');
      return;
    }
    
    // Check if stock is available
    if (stockCount <= 0) {
      showToast('❌ Out of stock', 'error');
      return;
    }
    
    setIsLoading(true);
    
    // Save to database (user must be logged in)
    api.addToCart(productId, 1)
      .then((response) => {
        // Sync full cart from server response to keep Redux state consistent
        if (response && response.cart) {
          dispatch(syncCart(response.cart));
        } else {
          // Fallback to addItem if response doesn't have full cart
          dispatch(addItem({ 
            productId, 
            quantity: 1,
            productName,
            productPrice,
            productImage
          }));
        }
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        onQuantityChange?.(1);
        showToast('✅ Added to cart', 'success');
      })
      .catch((error) => {
        showToast(`❌ ${error.message || 'Failed to add to cart'}`, 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoading, productId, stockCount, dispatch, onQuantityChange, showToast, isLoggedIn, productName, productPrice, productImage]);

  // Increment quantity
  const handleIncrement = useCallback(() => {
    if (isLoading) return;

    // Check if user is logged in
    if (!isLoggedIn) {
      showToast('❌ Please login to modify cart', 'error');
      return;
    }

    // Get fresh cart item from Redux store (not from closure)
    const freshCartItem = cartItems.find((item: CartItem) => item.productId === productId);
    const freshCurrentQuantity = freshCartItem?.quantity || initialQuantity;

    // Check if adding one more would exceed stock
    if (freshCurrentQuantity + 1 > stockCount) {
      showToast(`❌ Only ${stockCount} in stock`, 'error');
      return;
    }

    const newQuantity = freshCurrentQuantity + 1;
    setIsLoading(true);
    
    // Sync with database
    api.updateCartQuantity(productId, newQuantity)
      .then((response) => {
        // Sync full cart from server response to keep Redux state consistent
        if (response && response.cart) {
          dispatch(syncCart(response.cart));
        } else {
          // Fallback to updateQuantity if response doesn't have full cart
          dispatch(updateQuantity({ productId, quantity: newQuantity }));
        }
        onQuantityChange?.(newQuantity);
        showToast('✅ Quantity updated', 'success');
      })
      .catch((error) => {
        showToast(`❌ ${error.message || 'Failed to update cart'}`, 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoading, productId, cartItems, stockCount, dispatch, onQuantityChange, showToast, isLoggedIn, initialQuantity]);

  // Decrement quantity
  const handleDecrement = useCallback(() => {
    if (isLoading) return;

    // Check if user is logged in
    if (!isLoggedIn) {
      showToast('❌ Please login to modify cart', 'error');
      return;
    }

    // Get fresh cart item from Redux store (not from closure)
    const freshCartItem = cartItems.find((item: CartItem) => item.productId === productId);
    const freshCurrentQuantity = freshCartItem?.quantity || initialQuantity;

    const newQuantity = freshCurrentQuantity - 1;
    setIsLoading(true);

    // Sync with database
    if (newQuantity <= 0) {
      // Remove from cart when quantity reaches 0
      api.removeFromCart(productId)
        .then((response) => {
          // Sync full cart from server response to keep Redux state consistent
          if (response && response.cart) {
            dispatch(syncCart(response.cart));
          } else {
            // Fallback to removeItem if response doesn't have full cart
            dispatch(removeItem(productId));
          }
          showToast('✅ Item removed from cart', 'success');
          onQuantityChange?.(0);
        })
        .catch((error) => {
          showToast(`❌ ${error.message || 'Failed to remove item'}`, 'error');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Update quantity in database
      api.updateCartQuantity(productId, newQuantity)
        .then((response) => {
          // Sync full cart from server response to keep Redux state consistent
          if (response && response.cart) {
            dispatch(syncCart(response.cart));
          } else {
            // Fallback to updateQuantity if response doesn't have full cart
            dispatch(updateQuantity({ productId, quantity: newQuantity }));
          }
          onQuantityChange?.(newQuantity);
          showToast('✅ Quantity updated', 'success');
        })
        .catch((error) => {
          showToast(`❌ ${error.message || 'Failed to update cart'}`, 'error');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isLoading, productId, cartItems, dispatch, onQuantityChange, showToast, isLoggedIn, initialQuantity]);



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
