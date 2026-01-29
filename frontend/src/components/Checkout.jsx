// components/Checkout.js
import { useState } from 'react';
import { useCart } from '../hooks/useCart';
import styles from './css/Checkout.module.css';

const Checkout = ({ user }) => {
  const {totalItems, calculateTotalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const productsMap = {};
  const totalPrice = calculateTotalPrice(productsMap);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('¡Compra realizada con éxito! Gracias por tu pedido.');
      clearCart();
      window.location.href = '/';
    } catch (error) {
      alert('error al procesar el pago. Por favor, intenta de nuevo.');
      console.error('Error procesando el pago:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>💳 Checkout</h1>
      <p className={styles.userWelcome}>Hola, {user?.nombreCompleto}. Completa tu compra.</p>
      
      <div className={styles.checkoutGrid}>
        <div className={styles.checkoutForm}>
          <h2>Información de pago</h2>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <h3>Método de pago</h3>
              <div className={styles.paymentMethods}>
                <label className={styles.paymentMethod}>
                  <input type="radio" name="payment" defaultChecked />
                  <span>💳 Tarjeta de crédito/débito</span>
                </label>
                <label className={styles.paymentMethod}>
                  <input type="radio" name="payment" />
                  <span>💰 Pago en efectivo</span>
                </label>
                <label className={styles.paymentMethod}>
                  <input type="radio" name="payment" />
                  <span>🏦 Transferencia bancaria</span>
                </label>
              </div>
              
              <div className={styles.formGroup}>
                <label>Nombre en la tarjeta</label>
                <input type="text" required />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Número de tarjeta</label>
                  <input type="text" required placeholder="1234 5678 9012 3456" />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Fecha de expiración</label>
                  <input type="text" required placeholder="MM/AA" />
                </div>
                
                <div className={styles.formGroup}>
                  <label>CVV</label>
                  <input type="text" required placeholder="123" />
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isProcessing}
            >
              {isProcessing ? 'Procesando...' : `Pagar $${totalPrice.toFixed(2)}`}
            </button>
          </form>
        </div>

        <div className={styles.orderSummary}>
          <h3>Resumen del pedido</h3>
          
          <div className={styles.orderItems}>
            <p>Total productos: {totalItems}</p>
            <p>Subtotal: ${totalPrice.toFixed(2)}</p>
            <p>Envío: Gratis</p>
          </div>
          
          <div className={styles.summaryRowTotal}>
            <span>Total</span>
            <span className={styles.grandTotal}>${totalPrice.toFixed(2)}</span>
          </div>
          
          <div className={styles.orderNotes}>
            <p>Al realizar el pedido, aceptas nuestros términos y condiciones.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;