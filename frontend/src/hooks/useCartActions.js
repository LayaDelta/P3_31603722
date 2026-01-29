// hooks/useCartActions.js
import { useCart } from './useCart';

export const useCartActions = () => {
  const { 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    getItemCount,
    isProductInCart
  } = useCart();

  const handleAddToCart = (product, quantity = 1) => {
    addToCart(product, quantity);
  };

  const handleRemoveFromCart = (product, quantity = 1) => {
    removeFromCart(product.id, product.name, quantity);
  };

  const handleUpdateQuantity = (productId, quantity) => {
    updateQuantity(productId, quantity);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const getProductCount = (productId) => {
    return getItemCount(productId);
  };

  const checkStockAvailability = (product, quantity = 1) => {
    const currentInCart = getItemCount(product.id);
    return product.stock >= (currentInCart + quantity);
  };

  const isInCart = (productId) => {
    return isProductInCart(productId);
  };

  return {
    handleAddToCart,
    handleRemoveFromCart,
    handleUpdateQuantity,
    handleClearCart,
    getProductCount,
    checkStockAvailability,
    isInCart
  };
};