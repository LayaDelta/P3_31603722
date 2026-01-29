// components/AdminProducts.js
import { useEffect, useState } from 'react';
import { productService } from '../services/productService';
import styles from './css/AdminProducts.module.css';

const AdminProducts = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    brand: '',
    category: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAdminProducts();
      setProducts(response.data?.data || response.data || []);
      setError('');
    } catch (err) {
      setError('Error al cargar productos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await productService.createProduct(formData);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', price: '', stock: '', brand: '', category: '' });
      fetchProducts();
      alert('Producto creado exitosamente');
    } catch (err) {
      alert('Error al crear producto: ' + err.message);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      await productService.updateProduct(editingProduct.id, formData);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', stock: '', brand: '', category: '' });
      fetchProducts();
      alert('Producto actualizado exitosamente');
    } catch (err) {
      alert('Error al actualizar producto: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await productService.deleteProduct(productId);
        fetchProducts();
        alert('Producto eliminado exitosamente');
      } catch (err) {
        alert('Error al eliminar producto: ' + err.message);
      }
    }
  };

  const startEditing = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      brand: product.brand || '',
      category: product.category || ''
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminProducts}>
      <div className={styles.adminHeader}>
        <h2>👑 Panel de Administración de Productos</h2>
        <p className={styles.welcomeMessage}>Bienvenido, {user?.nombreCompleto}!</p>
        <button 
          onClick={() => setShowCreateForm(true)}
          className={styles.createButton}
        >
          ➕ Crear Nuevo Producto
        </button>
      </div>

      {(showCreateForm || editingProduct) && (
        <div className={styles.productForm}>
          <h3>{editingProduct ? '✏️ Editar Producto' : '➕ Crear Nuevo Producto'}</h3>
          <form onSubmit={editingProduct ? handleEditProduct : handleCreateProduct}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Precio *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Stock *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Marca</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Categoría</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingProduct(null);
                  setFormData({ name: '', description: '', price: '', stock: '', brand: '', category: '' });
                }}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.productsTable}>
        <h3>📋 Lista de Productos ({products.length})</h3>
        
        {products.length === 0 ? (
          <div className={styles.emptyTable}>
            <p>No hay productos registrados</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Marca</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>${product.price?.toFixed(2)}</td>
                  <td>
                    <span className={product.stock < 10 ? styles.lowStock : styles.normalStock}>
                      {product.stock}
                    </span>
                  </td>
                  <td>{product.brand || '-'}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button 
                        onClick={() => startEditing(product)}
                        className={styles.editButton}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className={styles.deleteButton}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.adminStats}>
        <div className={styles.statCard}>
          <h3>📊 Estadísticas</h3>
          <p>Total productos: <strong>{products.length}</strong></p>
          <p>Productos con stock bajo: <strong>{products.filter(p => p.stock < 10).length}</strong></p>
          <p>Valor total del inventario: <strong>
            ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}
          </strong></p>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;