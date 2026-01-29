// context/CartContext.jsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

// Crear el contexto
const CartContext = createContext();

// Provider que exporta componentes
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});
  const [products, setProducts] = useState({});
  const [notification, setNotification] = useState('');
  
  // Calcular totales usando useMemo para evitar recálculos innecesarios
  const { totalItems, totalPrice } = useMemo(() => {
    let items = 0;
    let price = 0;
    
    Object.entries(cart).forEach(([productId, quantity]) => {
      items += quantity;
      const product = products[productId];
      if (product && product.price) {
        price += product.price * quantity;
      }
    });
    
    return { totalItems: items, totalPrice: price };
  }, [cart, products]);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      const savedProducts = localStorage.getItem('cartProducts');
      
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      // Limpiar localStorage corrupto
      localStorage.removeItem('cart');
      localStorage.removeItem('cartProducts');
    }
  }, []);

  // Guardar carrito en localStorage cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
      localStorage.setItem('cartProducts', JSON.stringify(products));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart, products]);

  const showNotification = useCallback((message) => {
    setNotification(message);
    const timer = setTimeout(() => setNotification(''), 3000);
    return () => clearTimeout(timer);
  }, []);

  const hideNotification = useCallback(() => {
    setNotification('');
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    if (!product || !product.id || !product.name) {
      console.error('Producto inválido:', product);
      showNotification('Error al añadir producto al carrito');
      return;
    }

    setCart(prevCart => {
      const currentQuantity = prevCart[product.id] || 0;
      const newQuantity = currentQuantity + quantity;
      
      // Verificar stock disponible
      if (product.stock && newQuantity > product.stock) {
        showNotification(`Stock insuficiente. Solo quedan ${product.stock} unidades`);
        return prevCart;
      }
      
      return {
        ...prevCart,
        [product.id]: newQuantity
      };
    });
    
    // Guardar información completa del producto
    setProducts(prevProducts => ({
      ...prevProducts,
      [product.id]: {
        id: product.id,
        name: product.name || 'Producto sin nombre',
        price: Number(product.price) || 0,
        image: product.image || null,
        brand: product.brand || '',
        stock: product.stock || 0,
        category: product.category || ''
      }
    }));
    
    showNotification(`"${product.name}" añadido al carrito (${quantity})`);
  }, [showNotification]);

  const removeFromCart = useCallback((productId, productName = 'Producto', quantity = 1) => {
    setCart(prevCart => {
      const currentQuantity = prevCart[productId] || 0;
      const newQuantity = Math.max(0, currentQuantity - quantity);
      
      if (newQuantity === 0) {
        const { [productId]: _, ...rest } = prevCart;
        // También eliminar del objeto de productos si ya no está en el carrito
        setProducts(prev => {
          const { [productId]: __, ...restProducts } = prev;
          return restProducts;
        });
        return rest;
      }
      
      return {
        ...prevCart,
        [productId]: newQuantity
      };
    });
    
    showNotification(`"${productName}" removido del carrito`);
  }, [showNotification]);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      const { [productId]: _, ...rest } = cart;
      setCart(rest);
      // Eliminar del objeto de productos
      setProducts(prev => {
        const { [productId]: __, ...restProducts } = prev;
        return restProducts;
      });
    } else {
      // Verificar stock disponible
      const product = products[productId];
      if (product && product.stock && quantity > product.stock) {
        showNotification(`Solo puedes agregar hasta ${product.stock} unidades`);
        return;
      }
      
      setCart(prevCart => ({
        ...prevCart,
        [productId]: quantity
      }));
    }
  }, [cart, products, showNotification]);

  const clearCart = useCallback(() => {
    setCart({});
    setProducts({});
    showNotification('Carrito vaciado');
  }, [showNotification]);

  const getItemCount = useCallback((productId) => {
    return cart[productId] || 0;
  }, [cart]);

  const getCartCount = useCallback(() => {
    return totalItems;
  }, [totalItems]);

  const getProductInfo = useCallback((productId) => {
    return products[productId] || null;
  }, [products]);

  const getAllProducts = useCallback(() => {
    return products;
  }, [products]);

  const isProductInCart = useCallback((productId) => {
    return !!cart[productId];
  }, [cart]);

  const getCartSummary = useCallback(() => {
    const items = Object.entries(cart).map(([productId, quantity]) => {
      const product = products[productId];
      return {
        productId,
        quantity,
        product: product || null,
        total: product ? product.price * quantity : 0
      };
    });
    
    return {
      items,
      totalItems,
      totalPrice,
      itemCount: items.length
    };
  }, [cart, products, totalItems, totalPrice]);

  const value = useMemo(() => ({
    cart,
    products,
    notification,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemCount,
    getCartCount,
    getProductInfo,
    getAllProducts,
    isProductInCart,
    getCartSummary,
    hideNotification
  }), [
    cart,
    products,
    notification,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemCount,
    getCartCount,
    getProductInfo,
    getAllProducts,
    isProductInCart,
    getCartSummary,
    hideNotification
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Exportar el contexto para usarlo en otro archivo
export { CartContext };
