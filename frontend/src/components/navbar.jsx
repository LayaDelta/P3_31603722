import { Link, useNavigate } from 'react-router-dom';
import styles from './css/Navbar.module.css'; // Importar CSS Module

const Navbar = ({ isAuthenticated, user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const getWelcomeMessage = () => {
    if (!user) return null;
    
    const firstName = user.nombreCompleto?.split(' ')[0] || user.email?.split('@')[0];
    return `Hola, ${firstName}!`;
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.leftSection}>
        <Link to="/" className={styles.logo}>
          🛒 Mi Tienda
        </Link>
        
        {isAuthenticated && user && (
          <div className={styles.welcomeMessage}>
            <span className={styles.welcomeText}>
              {getWelcomeMessage()}
            </span>
            <span className={user.role === 'admin' ? styles.adminBadge : styles.userBadge}>
              {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
            </span>
          </div>
        )}
      </div>
      
      <div className={styles.links}>
        <Link to="/" className={styles.link}>🏠 Inicio</Link>
        
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className={styles.link}>
              📊 Dashboard
            </Link>
            
            {user?.role === 'admin' && (
              <Link to="/admin/products" className={styles.adminLink}>
                ⚙️ Administrar
              </Link>
            )}
            
            <Link to="/profile" className={styles.link}>
              👤 Perfil
            </Link>
            
            <div className={styles.userMenu}>
              <button 
                onClick={handleLogoutClick} 
                className={styles.logoutButton}
                title="Cerrar sesión"
              >
                🔓 Salir
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className={styles.loginButton}>
            🔑 Iniciar Sesión
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;