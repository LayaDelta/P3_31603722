/**
 * Configura todas las relaciones entre modelos - VERSIÓN CORREGIDA
 */
module.exports = function setupAssociations(sequelize) {
  try {
    console.log('🔗 Estableciendo relaciones entre modelos...');
    
    // DEBUG: Mostrar qué modelos están disponibles
    console.log('📋 Modelos disponibles en sequelize.models:', Object.keys(sequelize.models));
    
    // Obtener modelos directamente del objeto models
    const models = sequelize.models;
    
    // Verificar modelos esenciales con nombres correctos
    const User = models.User || models.user;
    const Category = models.Category || models.category;
    const Product = models.Product || models.product;
    const Tag = models.Tag || models.tag;
    const ProductTag = models.ProductTag || models.producttag || models.ProductTags;
    
    // Lista de modelos requeridos
    const requiredModels = [
      { name: 'User', model: User },
      { name: 'Category', model: Category },
      { name: 'Product', model: Product },
      { name: 'Tag', model: Tag },
      { name: 'ProductTag', model: ProductTag }
    ];
    
    // Verificar que todos existan
    const missingModels = requiredModels.filter(item => !item.model);
    
    if (missingModels.length > 0) {
      const missingNames = missingModels.map(item => item.name);
      console.error(`❌ Faltan modelos: ${missingNames.join(', ')}`);
      console.log('💡 Verifica que los archivos de modelos estén en la carpeta models/');
      return;
    }
    
    console.log(`✅ Todos los modelos encontrados: ${requiredModels.map(item => item.name).join(', ')}`);
    
    // 1. Category 1:N Product
    Category.hasMany(Product, {
      foreignKey: 'categoryId',
      onDelete: 'SET NULL',
      as: 'products'
    });
    
    Product.belongsTo(Category, {
      foreignKey: 'categoryId',
      as: 'category',
      onDelete: 'SET NULL'
    });
    
    // 2. Product N:M Tag (a través de ProductTag)
    Product.belongsToMany(Tag, {
      through: ProductTag,
      as: 'tags',
      foreignKey: 'productId',
      otherKey: 'tagId',
      onDelete: 'CASCADE'
    });
    
    Tag.belongsToMany(Product, {
      through: ProductTag,
      as: 'products',
      foreignKey: 'tagId',
      otherKey: 'productId',
      onDelete: 'CASCADE'
    });
    
    // 3. Relaciones directas con tabla intermedia (opcionales)
    Product.hasMany(ProductTag, {
      foreignKey: 'productId',
      as: 'productTagAssociations'
    });
    
    Tag.hasMany(ProductTag, {
      foreignKey: 'tagId',
      as: 'tagProductAssociations'
    });
    
    ProductTag.belongsTo(Product, {
      foreignKey: 'productId'
    });
    
    ProductTag.belongsTo(Tag, {
      foreignKey: 'tagId'
    });
    
    console.log('✅ Relaciones establecidas correctamente\n');
    
  } catch (error) {
    console.error('❌ Error estableciendo relaciones:', error.message);
    console.error(error.stack);
  }
};