const { DataTypes } = require('sequelize');
const slugify = require('slugify');

module.exports = (sequelize) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          min: 0,
        },
      },

      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      sku: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },

      sector: {
        type: DataTypes.ENUM('entretenimiento', 'tecnologia', 'seguridad', 'finanzas'),
        allowNull: false,
      },

      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },

      slug: {
        type: DataTypes.STRING,
        unique: true,
      },
    },
    {
      tableName: 'products',
      timestamps: true,
    }
  );

  // Genera el slug basado en el nombre
  const generateSlug = (product) => {
    if (product.name) {
      product.slug = slugify(product.name, {
        lower: true,
        strict: true,
      });
    }
  };

  // Generar slug al crear
  Product.beforeCreate((product) => {
    generateSlug(product);
  });

  // Regenerar slug si el nombre cambia
  Product.beforeUpdate((product) => {
    if (product.changed('name')) {
      generateSlug(product);
    }
  });

  return Product;
};
