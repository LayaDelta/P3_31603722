// components/CartNotification.js
import { useCart } from '../hooks/useCart'; // Para usar el hook directamente
import styles from './css/CartNotification.module.css';

const CartNotification = () => {
  const { notification, hideNotification } = useCart();

  if (!notification) return null;

  return (
    <div className={styles.notification}>
      <div className={styles.notificationContent}>
        <span className={styles.notificationMessage}>{notification}</span>
        <button 
          onClick={hideNotification} 
          className={styles.notificationClose}
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default CartNotification;