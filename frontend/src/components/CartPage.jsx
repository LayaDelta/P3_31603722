// components/CartPage.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import CartNotification from './CartNotification';
import styles from './css/CartPage.module.css';

const CartPage = () => {
  const { 
    cart, 
    totalItems, 
    totalPrice, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getProductInfo
  } = useCart();
  
  // La variable 'products' ya no es necesaria ya que usamos getProductInfo directamente
  // const products = getAllProducts(); // ← Esta línea se elimina

  const handleQuantityChange = (productId, newQuantity) => {
    const product = getProductInfo(productId);
    if (product && newQuantity >= 0 && newQuantity <= product.stock) {
      updateQuantity(productId, newQuantity);
    }
  };

  if (totalItems === 0) {
    return (
      <div className={styles.container}>
        <CartNotification />
        <div className={styles.emptyCart}>
          <div className={styles.emptyCartIcon}>🛒</div>
          <h2>Tu carrito está vacío</h2>
          <p>¡Agrega algunos productos para comenzar a comprar!</p>
          <Link to="/" className={styles.continueShopping}>
            ← Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CartNotification />
      
      <div className={styles.cartHeader}>
        <h1>🛒 Mi Carrito</h1>
        <div className={styles.cartSummary}>
          <span className={styles.totalItems}>
            <span className={styles.summaryIcon}>📦</span>
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
          </span>
          <span className={styles.totalPrice}>
            <span className={styles.summaryIcon}>💰</span>
            Total: ${totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      <div className={styles.cartContent}>
        <div className={styles.cartItems}>
          {Object.entries(cart).map(([productId, quantity]) => {
            const product = getProductInfo(productId);
            
            if (!product) {
              return null;
            }

            const itemTotal = product.price * quantity;
            const isLowStock = product.stock < 10;

            return (
              <div key={productId} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className={styles.placeholderImage}>
                      📦
                    </div>
                  )}
                </div>
                
                <div className={styles.itemDetails}>
                  <h3>{product.name}</h3>
                  {product.brand && (
                    <p className={styles.itemBrand}>Marca: {product.brand}</p>
                  )}
                  <p className={styles.itemPrice}>${product.price.toFixed(2)} c/u</p>
                  
                  {isLowStock && (
                    <div className={styles.lowStockWarning}>
                      ⚠️ Solo quedan {product.stock} unidades
                    </div>
                  )}
                </div>
                
                <div className={styles.itemActions}>
                  <div className={styles.quantityControl}>
                    <button 
                      onClick={() => handleQuantityChange(productId, quantity - 1)}
                      className={styles.quantityBtn}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className={styles.quantity}>{quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(productId, quantity + 1)}
                      className={styles.quantityBtn}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(productId, product.name)}
                    className={styles.removeBtn}
                    title="Eliminar del carrito"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
                
                <div className={styles.itemTotal}>
                  <div className={styles.itemTotalAmount}>${itemTotal.toFixed(2)}</div>
                  <div className={styles.itemUnitPrice}>
                    {quantity} × ${product.price.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.cartSidebar}>
          <div className={styles.orderSummary}>
            <h3>Resumen del Pedido</h3>
            
            <div className={styles.summaryDetails}>
              {Object.entries(cart).map(([productId, quantity]) => {
                const product = getProductInfo(productId);
                if (!product) return null;
                
                return (
                  <div key={productId} className={styles.summaryItem}>
                    <span className={styles.summaryItemName}>
                      {product.name} ×{quantity}
                    </span>
                    <span className={styles.summaryItemPrice}>
                      ${(product.price * quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className={styles.summaryRow}>
              <span>Subtotal ({totalItems} productos)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            
            <div className={styles.summaryRow}>
              <span>Envío</span>
              <span className={styles.freeShipping}>Gratis</span>
            </div>
            
            <div className={styles.summaryRowTotal}>
              <span>Total a pagar</span>
              <span className={styles.grandTotal}>${totalPrice.toFixed(2)}</span>
            </div>
            
            <Link 
              to="/checkout"
              className={styles.checkoutButton}
            >
              💳 Proceder al pago
            </Link>
            
            <button 
              onClick={clearCart}
              className={styles.clearCartButton}
            >
              🗑️ Vaciar carrito
            </button>
            
            <Link to="/" className={styles.continueShopping}>
              ← Continuar comprando
            </Link>
          </div>
          
          <div className={styles.securityBanner}>
            <div className={styles.securityIcon}>🔒</div>
            <div className={styles.securityText}>
              <h4>Compra 100% segura</h4>
              <p>Tu información está protegida con encriptación SSL</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;