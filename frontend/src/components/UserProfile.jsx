import { useEffect, useState } from 'react';
import { authService } from '../services/productService';
import styles from './css/UserProfile.module.css'; // Importar CSS Module

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, );

  const loadUserProfile = async () => {
    try {
      const response = await authService.getProfile();
      const userData = response.data;
      setUser(userData);
      setFormData({
        ...formData,
        nombreCompleto: userData.nombreCompleto,
        email: userData.email
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // Validar que las contraseñas coincidan si se cambia
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setMessage('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }
      
      const updateData = {
        nombreCompleto: formData.nombreCompleto
      };
      
      // Solo incluir password si se proporciona
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      // Llamar al endpoint de actualización
      await authService.updateProfile(updateData);
      setMessage('Perfil actualizado exitosamente');
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className={styles.loading}>Cargando perfil...</div>;

  return (
    <div className={styles.userProfile}>
      <h2>Mi Perfil</h2>
      
      {message && (
        <div className={`${styles.message} ${message.includes('exitosamente') ? styles.success : styles.error}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleUpdateProfile} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Nombre Completo:</label>
          <input
            type="text"
            value={formData.nombreCompleto}
            onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})}
            required
            className={styles.input}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            disabled
            className={`${styles.input} ${styles.disabledInput}`}
          />
          <small>El email no se puede cambiar</small>
        </div>
        
        <div className={styles.formGroup}>
          <label>Contraseña Actual:</label>
          <input
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
            placeholder="Dejar en blanco si no quieres cambiar"
            className={styles.input}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Nueva Contraseña:</label>
          <input
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
            placeholder="Dejar en blanco si no quieres cambiar"
            className={styles.input}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Confirmar Nueva Contraseña:</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            placeholder="Dejar en blanco si no quieres cambiar"
            className={styles.input}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? 'Actualizando...' : 'Actualizar Perfil'}
        </button>
      </form>
      
      <div className={styles.userInfo}>
        <h3>Información de la cuenta</h3>
        <p><strong>Rol:</strong> {user.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
        <p><strong>Miembro desde:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        <p><strong>Estado:</strong> {user.active ? 'Activo' : 'Inactivo'}</p>
      </div>
    </div>
  );
};

export default UserProfile;