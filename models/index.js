const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');
const slugify = require('slugify');

// Configuración de la base de datos SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false,
});

/* MODELO: User */
const User = sequelize.define(
  'User',
  {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    nombreCompleto: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    email: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true, 
      validate: { 
        isEmail: true 
      } 
    },
    password: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    defaultScope: { 
      attributes: { exclude: ['password'] } 
    },
  }
);

// Encriptar contraseña al crear o actualizar
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Método para validar contraseña
User.prototype.validarPassword = async function (passwordPlano) {
  return await bcrypt.compare(passwordPlano, this.password);
};

/* MODELO: Category */
const Category = sequelize.define(
  'Category',
  {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    name: { 
      type: DataTypes.STRING, 
      unique: true, 
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: { 
      type: DataTypes.TEXT 
    },
    // Sequelize automáticamente añade createdAt y updatedAt
  },
  { 
    tableName: 'categories', 
    timestamps: true,
    // Asegurar que Sequelize maneje los timestamps correctamente
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);

/* MODELO: Tag */
const Tag = sequelize.define(
  'Tag',
  {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    name: { 
      type: DataTypes.STRING, 
      unique: true, 
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
  },
  { 
    tableName: 'tags', 
    timestamps: true 
  }
);

/* MODELO: Product */
const Product = sequelize.define(
  'Product',
  {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    name: { 
      type: DataTypes.STRING, 
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    description: { 
      type: DataTypes.TEXT 
    },
    price: { 
      type: DataTypes.FLOAT, 
      allowNull: false,
      validate: {
        min: 0
      }
    },
    stock: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    brand: { 
      type: DataTypes.STRING 
    },
    sku: { 
      type: DataTypes.STRING, 
      unique: true 
    },
    slug: { 
      type: DataTypes.STRING, 
      unique: true 
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'categories',
        key: 'id'
      },
      allowNull: false,
      validate: {
        notNull: true
      }
    }
  },
  { 
    tableName: 'products', 
    timestamps: true,
    hooks: {
      beforeValidate: async (product) => {
        // Generar SKU automático si no existe
        if (!product.sku) {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substring(2, 5);
          product.sku = `SKU-${timestamp}-${random}`.toUpperCase();
        }
      },
      beforeCreate: async (product) => {
        // Generar slug automáticamente
        if (product.name && !product.slug) {
          let baseSlug = slugify(product.name, { 
            lower: true, 
            strict: true,
            remove: /[*+~.()'"!:@]/g
          });
          
          // Verificar unicidad
          let slug = baseSlug;
          let counter = 1;
          while (await Product.findOne({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }
          product.slug = slug;
        }
      },
      beforeUpdate: async (product) => {
        // Regenerar slug si cambia el nombre
        if (product.changed('name')) {
          let baseSlug = slugify(product.name, { 
            lower: true, 
            strict: true,
            remove: /[*+~.()'"!:@]/g
          });
          
          // Verificar unicidad excluyendo el producto actual
          let slug = baseSlug;
          let counter = 1;
          while (await Product.findOne({ 
            where: { 
              slug,
              id: { [Sequelize.Op.ne]: product.id }
            } 
          })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }
          product.slug = slug;
        }
      }
    }
  }
);

/* MODELO EXPLÍCITO PARA TABLA INTERMEDIA ProductTags */
const ProductTag = sequelize.define(
  'ProductTag',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'products',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false
    },
    tagId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'tags',
        key: 'id'
      },
      onDelete: 'CASCADE',
      allowNull: false
    }
  },
  {
    tableName: 'ProductTags',
    timestamps: true,
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ['productId', 'tagId'],  // Índice único compuesto
        name: 'product_tag_unique'
      }
    ]
  }
);

/* RELACIONES CORREGIDAS Y COMPLETAS */

// 1. Category 1:N Product
Category.hasMany(Product, { 
  foreignKey: 'categoryId', 
  onDelete: 'SET NULL', 
  as: 'products',
  hooks: true
});

Product.belongsTo(Category, { 
  foreignKey: 'categoryId', 
  as: 'category',
  onDelete: 'SET NULL'
});

// 2. Product N:M Tag usando modelo EXPLÍCITO (CORRECCIÓN PRINCIPAL)
Product.belongsToMany(Tag, {
  through: ProductTag,  // ¡USAR MODELO, NO STRING!
  as: 'tags',
  foreignKey: 'productId',
  otherKey: 'tagId',
  onDelete: 'CASCADE'
});

Tag.belongsToMany(Product, {
  through: ProductTag,  // ¡USAR MODELO, NO STRING!
  as: 'products',
  foreignKey: 'tagId',
  otherKey: 'productId',
  onDelete: 'CASCADE'
});

// 3. Relaciones directas con tabla intermedia (opcional pero útil)
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

// 4. Métodos de instancia útiles
Product.prototype.assignTags = async function(tagIds) {
  try {
    if (!Array.isArray(tagIds)) {
      tagIds = [tagIds];
    }
    
    // Verificar que los tags existan
    const tags = await Tag.findAll({
      where: { id: tagIds }
    });
    
    if (tags.length !== tagIds.length) {
      const foundIds = tags.map(tag => tag.id);
      const missingIds = tagIds.filter(id => !foundIds.includes(id));
      throw new Error(`Los siguientes tags no existen: ${missingIds.join(', ')}`);
    }
    
    // Usar setTags para reemplazar todas las asociaciones
    await this.setTags(tags);
    return tags;
  } catch (error) {
    console.error('Error asignando tags:', error);
    throw error;
  }
};

Product.prototype.addTag = async function(tagId) {
  const tag = await Tag.findByPk(tagId);
  if (!tag) {
    throw new Error(`Tag con ID ${tagId} no existe`);
  }
  await this.addTag(tag);
};

/* FUNCIÓN PARA VERIFICAR/REPARAR BASE DE DATOS */
async function verifyDatabase() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    // Verificar que todas las tablas existan con estructura correcta
    await sequelize.sync({ alter: false });
    
    // Verificar específicamente ProductTags
    const [productTagsInfo] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='ProductTags'
    `);
    
    if (productTagsInfo.length === 0) {
      console.log('⚠️  Tabla ProductTags no existe, creando...');
      await ProductTag.sync({ force: true });
    } else {
      // Verificar estructura
      const [columns] = await sequelize.query(`PRAGMA table_info(ProductTags);`);
      const columnNames = columns.map(col => col.name);
      
      if (!columnNames.includes('createdAt') || !columnNames.includes('updatedAt')) {
        console.log('⚠️  ProductTags sin timestamps, recreando...');
        await ProductTag.sync({ force: true });
      }
    }
    
    console.log('✅ Base de datos verificada y lista');
    return true;
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
    return false;
  }
}

// Ejecutar verificación al cargar el módulo (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  verifyDatabase().catch(console.error);
}

/* EXPORTAR TODOS LOS MODELOS INCLUYENDO ProductTag */
module.exports = {
  sequelize,
  User,
  Category,
  Tag,
  Product,
  ProductTag,  // ¡EXPORTAR LA TABLA INTERMEDIA!
  
  // Exportar función de verificación por si se necesita manualmente
  verifyDatabase
};