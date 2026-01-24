const { DataTypes } = require('sequelize');
const slugify = require('slugify');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    sector: {
      type: DataTypes.ENUM('entretenimiento', 'tecnologia', 'seguridad', 'finanzas'),
      allowNull: true // Hacerlo opcional para compatibilidad
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    images: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const value = this.getDataValue('images');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue('images', JSON.stringify(value || []));
      }
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
      allowNull: true
    }
  }, {
    tableName: 'products',
    timestamps: true
  });

  // Hooks para SKU y Slug
  Product.beforeValidate(async (product) => {
    if (!product.sku) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 5);
      product.sku = `SKU-${timestamp}-${random}`.toUpperCase();
    }
  });

  Product.beforeCreate(async (product) => {
    if (product.name && !product.slug) {
      product.slug = await generateUniqueSlug(product, null);
    }
  });

  Product.beforeUpdate(async (product) => {
    if (product.changed('name')) {
      product.slug = await generateUniqueSlug(product, product.id);
    }
  });

  // Función auxiliar para slugs únicos
  async function generateUniqueSlug(product, excludeId) {
    let baseSlug = slugify(product.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    let slug = baseSlug;
    let counter = 1;
    
    const whereClause = { slug };
    if (excludeId) {
      whereClause.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    
    while (await sequelize.models.Product?.findOne({ where: whereClause })) {
      slug = `${baseSlug}-${counter}`;
      whereClause.slug = slug;
      counter++;
    }
    
    return slug;
  }

  return Product;
};