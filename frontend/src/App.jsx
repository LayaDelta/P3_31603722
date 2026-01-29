// App.js
import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import AdminProducts from './components/AdminProducts';
import CartPage from './components/CartPage';
import Checkout from './components/Checkout';
import Dashboard from './components/Dashboard';
import Login from './Components/Login';
import Navbar from './components/navbar';
import PrivateRoute from './components/PrivateRoute';
import ProductList from './Components/ProductList';
import UserProfile from './components/UserProfile';
import { CartProvider } from './context/CartContext';
import { authService } from './services/productService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('Verificando autenticación...', { 
        token: token ? 'Token presente' : 'No token',
        storedUser: storedUser ? 'User presente' : 'No user'
      });
      
      if (!token || !storedUser) {
        console.log('No hay token o usuario en localStorage');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        
        console.log('Usuario recuperado de localStorage:', userData);
        
        setUser(userData);
        setIsAuthenticated(true);
        
      } catch (error) {
        console.error('Error recuperando sesión:', error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (token, userData) => {
    console.log('Guardando datos de sesión...', { 
      token: token ? 'Token guardado' : 'No token',
      userData
    });
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión del backend:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">Cargando aplicación...</div>
      </div>
    );
  }

  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Navbar 
            isAuthenticated={isAuthenticated} 
            user={user}
            onLogout={handleLogout} 
          />
          <div className="container">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<ProductList />} />
              <Route path="/cart" element={<CartPage />} />
              
              {/* Ruta de login */}
              <Route 
                path="/login" 
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                } 
              />
              
              {/* Rutas privadas */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Dashboard user={user} />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <UserProfile user={user} />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/checkout" 
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Checkout user={user} />
                  </PrivateRoute>
                } 
              />
              
              {/* Rutas de administrador */}
              <Route 
                path="/admin/products" 
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    {user?.role === 'admin' ? (
                      <AdminProducts user={user} />
                    ) : (
                      <div className="access-denied">
                        <h2>🔒 Acceso Denegado</h2>
                        <p>No tienes permisos de administrador para acceder a esta página.</p>
                        <button 
                          onClick={() => window.location.href = '/dashboard'}
                          className="back-button"
                        >
                          Volver al Dashboard
                        </button>
                      </div>
                    )}
                  </PrivateRoute>
                } 
              />
              
              {/* Ruta 404 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;