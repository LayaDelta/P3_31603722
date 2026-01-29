// components/ProductList.js
import { useEffect, useState } from 'react';
import { useCartActions } from '../hooks/useCartActions';
import { productService } from '../services/productService';
import CartNotification from './CartNotification';
import CartSummary from './CartSummary';
import ProductCard from './ProductCard';
import styles from './css/ProductList.module.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { handleAddToCart, checkStockAvailability } = useCartActions();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getPublicProducts();
        
        console.log('Respuesta completa:', response);
        
        let productsData = [];
        
        if (response.data) {
          if (response.data.data && Array.isArray(response.data.data)) {
            productsData = response.data.data;
          } else if (Array.isArray(response.data)) {
            productsData = response.data;
          } else if (response.data.products && Array.isArray(response.data.products)) {
            productsData = response.data.products;
          } else {
            console.warn('Estructura de respuesta inesperada:', response.data);
            if (typeof response.data === 'object' && response.data !== null) {
              productsData = Object.values(response.data);
            }
          }
        }
        
        if (!Array.isArray(productsData)) {
          productsData = [];
        }
        
        console.log('Productos procesados:', productsData);
        setProducts(productsData);
        setError('');
      } catch (err) {
        setError(`Error al cargar productos: ${err.message}`);
        console.error('Error detallado:', err);
        console.error('Respuesta de error:', err.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleBuyNow = (product) => {
    // Primero añadimos al carrito
    if (checkStockAvailability(product)) {
      handleAddToCart(product);
      // Luego redirigimos a checkout (simulado)
      setTimeout(() => {
        alert(`Procederías al pago del producto: ${product.name}`);
        // window.location.href = '/checkout'; // En producción
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Cargando productos...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            onClick={handleRetry}
            className={styles.retryButton}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Productos</h2>
        <div className={styles.empty}>
          <p>No hay productos disponibles en este momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CartNotification />
      
      <div className={styles.header}>
        <h2 className={styles.title}>Productos Disponibles</h2>
        <CartSummary />
      </div>
      
      <div className={styles.productGrid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;