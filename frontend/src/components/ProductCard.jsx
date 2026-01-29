// components/ProductCard.js
import { useCartActions } from '../hooks/useCartActions';
import styles from './css/ProductList.module.css';

const ProductCard = ({ product, onAddToCart, onBuyNow }) => {
  const { getProductCount, checkStockAvailability } = useCartActions();
  const cartCount = getProductCount(product.id);
  const isOutOfStock = product.stock === 0;
  const isStockLow = product.stock > 0 && product.stock < 10;
  const canAddToCart = checkStockAvailability(product);

  const handleAddClick = () => {
    if (canAddToCart) {
      onAddToCart(product);
    }
  };

  const handleBuyClick = () => {
    if (canAddToCart) {
      onBuyNow(product);
    }
  };

  return (
    <div 
      className={`${styles.productCard} ${product.isNew ? styles.new : ''} ${isOutOfStock ? styles.outOfStock : ''}`}
    >
      {isOutOfStock && (
        <div className={styles.outOfStockBadge}>AGOTADO</div>
      )}
      
      <h3 className={styles.productName}>{product.name}</h3>
      <p className={styles.productDescription}>
        {product.description || 'Sin descripción disponible'}
      </p>
      
      <div className={styles.productDetails}>
        <p className={styles.productPrice}>
          ${product.price?.toFixed(2) || '0.00'}
        </p>
        <p 
          className={styles.productStock}
          data-low-stock={isStockLow}
        >
          Stock: {product.stock || 0} unidades
        </p>
        {product.brand && (
          <p className={styles.productBrand}>
            Marca: {product.brand}
          </p>
        )}
      </div>
      
      <div className={styles.productActions}>
        {!isOutOfStock ? (
          <>
            <button 
              onClick={handleAddClick}
              className={styles.addToCartButton}
              disabled={!canAddToCart}
              title={!canAddToCart ? 'Stock insuficiente' : 'Añadir al carrito'}
            >
              <span className={styles.buttonIcon}>+</span>
              Añadir al carrito
              {cartCount > 0 && (
                <span className={styles.cartItemCount}>
                  {cartCount}
                </span>
              )}
            </button>
            
            <button 
              onClick={handleBuyClick}
              className={styles.buyNowButton}
              disabled={!canAddToCart}
              title={!canAddToCart ? 'Stock insuficiente' : 'Comprar ahora'}
            >
              <span className={styles.buttonIcon}>⚡</span>
              Comprar ahora
            </button>
          </>
        ) : (
          <button 
            className={styles.notifyButton}
            onClick={() => alert(`Te notificaremos cuando ${product.name} esté disponible`)}
          >
            Notificar disponibilidad
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;