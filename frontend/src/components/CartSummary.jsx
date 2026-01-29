// components/CartSummary.js
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import styles from './css/CartSummary.module.css';

const CartSummary = () => {
  const { getCartCount } = useCart();

  return (
    <Link to="/cart" className={styles.cartSummary}>
      <span className={styles.cartIcon}>🛒</span>
      <span className={styles.cartCount}>
        {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'}
      </span>
    </Link>
  );
};

export default CartSummary;