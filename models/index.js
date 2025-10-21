
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');

// Configuración de la base de datos SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false,
});

// Definición del modelo User
const User = sequelize.define('User', {
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
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['password'] } 
  }
});

//  Hook para cifrar contraseña antes de crear
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

//  Hook para cifrar contraseña antes de actualizar si cambió
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Método para validar contraseña
User.prototype.validarPassword = async function(passwordPlano) {
  return await bcrypt.compare(passwordPlano, this.password);
};

// Exportar la conexión y el modelo
module.exports = {
  sequelize,
  User,
};
