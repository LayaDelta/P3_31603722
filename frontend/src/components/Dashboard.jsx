import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import styles from './css/Dashboard.module.css'; // Importar CSS Module

const Dashboard = ({ user }) => {
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) {
        setError('No hay información de usuario disponible');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Cargar datos según rol
        if (user.role === 'admin') {
          const productsResponse = await productService.getAllProducts();
          setUserProducts(productsResponse.data || []);
        } else {
          const productsResponse = await productService.getPublicProducts();
          setUserProducts(productsResponse.data || []);
        }
        
        setError('');
      } catch (err) {
        console.error('Error cargando productos:', err);
        setError('Error al cargar productos. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error: No hay información de usuario</h2>
        <button onClick={() => navigate('/login')} className={styles.button}>
          Ir a Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className={styles.button}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📊 Dashboard</h1>
        <p>Bienvenido a tu panel de control</p>
      </div>
      
      <div className={styles.userCard}>
        <div className={styles.userInfo}>
          <h2>👤 Información del Usuario</h2>
          <p><strong>Nombre:</strong> {user.nombreCompleto || 'No disponible'}</p>
          <p><strong>Email:</strong> {user.email || 'No disponible'}</p>
          <p><strong>Rol:</strong> 
            <span className={user.role === 'admin' ? styles.adminBadge : styles.userBadge}>
              {user.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
            </span>
          </p>
        </div>
        
        <div className={styles.actions}>
          <h3>Acciones Disponibles</h3>
          <div className={styles.actionButtons}>
            {user.role === 'admin' && (
              <button 
                className={styles.adminButton}
                onClick={() => navigate('/admin/products')}
              >
                ⚙️ Panel de Administración
              </button>
            )}
            <button 
              className={styles.productsButton}
              onClick={() => navigate('/')}
            >
              🛍️ Ver Productos
            </button>
            <button 
              className={styles.profileButton}
              onClick={() => navigate('/profile')}
            >
              👤 Ver Perfil
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles.stats}>
        <h2>📈 Productos Disponibles</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total de Productos</h3>
            <p className={styles.statNumber}>{userProducts.length}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Tu Rol</h3>
            <p>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Estado</h3>
            <p className={styles.activeStatus}>{user.active ? '✅ Activo' : '❌ Inactivo'}</p>
          </div>
        </div>
      </div>
      
      {userProducts.length > 0 && (
        <div className={styles.recentProducts}>
          <h3>📋 Productos Recientes</h3>
          <div className={styles.productList}>
            {userProducts.slice(0, 3).map(product => (
              <div key={product.id} className={styles.productItem}>
                <h4>{product.name}</h4>
                <p>${product.price}</p>
                <p className={styles.productStock}>Stock: {product.stock}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;