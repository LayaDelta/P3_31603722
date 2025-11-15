const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');

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
      primaryKey: true,
    },
    nombreCompleto: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
  }
);

// Encriptar contraseña al crear usuario
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

// Encriptar nuevamente si la contraseña cambia
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
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  { tableName: 'categories', timestamps: true }
);

/* MODELO: Tag */
const Tag = sequelize.define(
  'Tag',
  {
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  },
  { tableName: 'tags', timestamps: true }
);

/* MODELO: Product */
const Product = sequelize.define(
  'Product',
  {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.FLOAT, allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },

    brand: { type: DataTypes.STRING },
    sku: { type: DataTypes.STRING, unique: true },

    slug: { type: DataTypes.STRING, unique: true },
  },
  { tableName: 'products', timestamps: true }
);

// Generar slug basado en el nombre
Product.beforeSave(async (product) => {
  if (product.changed('name')) {
    product.slug = product.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')     // quitar acentos
      .replace(/[^a-z0-9]+/g, '-')        // reemplazar espacios por guiones
      .replace(/^-+|-+$/g, '');           // limpiar guiones sobrantes
  }
});

/* RELACIONES ENTRE MODELOS */

// Category 1:N Product
Category.hasMany(Product, {
  foreignKey: 'categoryId',
  onDelete: 'SET NULL',
  as: 'products',
});
Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

// Product N:M Tag
Product.belongsToMany(Tag, {
  through: 'ProductTags',
  as: 'tags',
  timestamps: false,
});
Tag.belongsToMany(Product, {
  through: 'ProductTags',
  as: 'products',
  timestamps: false,
});

/* EXPORTAR MODELOS */
module.exports = {
  sequelize,
  User,
  Category,
  Tag,
  Product,
};
