import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/productService';
import styles from './css/Login.module.css'; // Importar CSS Module

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  
  try {
    console.log('🔐 Enviando credenciales...');
    
    const response = await authService.login({ email, password });
    
    console.log('✅ Login exitoso, respuesta completa:', response);
    console.log('📊 Estructura de respuesta:', response.data);
    
    // EXTRAER DATOS SEGÚN LA ESTRUCTURA DE TU BACKEND
    const { data } = response.data;
    
    // Tu backend devuelve: { status: 'success', data: { usuario: {...}, token: '...' } }
    const token = data.token;
    const user = data.usuario; // ← ¡IMPORTANTE! Es "usuario", no "user"
    
    console.log('🔑 Token recibido:', token ? '✅ Presente' : '❌ Ausente');
    console.log('👤 Usuario recibido:', user);
    
    if (!token || !user) {
      console.error('❌ Faltan datos en la respuesta:', { token, user });
      throw new Error('Faltan datos en la respuesta del servidor');
    }
    
    // Guardar en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    console.log('💾 Datos guardados en localStorage');
    
    // Llamar a onLogin con los datos correctos
    onLogin(token, user);
    
    // Redirigir al dashboard
    navigate('/dashboard');
    
  } catch (err) {
    console.error('❌ Error completo de login:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    
    // Mostrar mensaje específico del backend
    const backendMessage = err.response?.data?.message;
    setError(
      backendMessage || 
      'Error de autenticación. Usa admin@test.com / 123456'
    );
  } finally {
    setLoading(false);
  }
};
  const fillTestCredentials = () => {
    setEmail('admin@test.com');
    setPassword('123456');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Iniciar Sesión</h2>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="admin@test.com"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="123456"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        
        <div className={styles.testCredentials}>
          <p className={styles.testText}>Credenciales de prueba:</p>
          <button 
            type="button" 
            onClick={fillTestCredentials}
            className={styles.testButton}
          >
            Usar admin@test.com / 123456
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;