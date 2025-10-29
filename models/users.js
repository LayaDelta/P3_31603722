const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    }
  }, {
    tableName: 'users',
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['password'] }
    }
  });

  // Generar ID aleatorio y cifrar la contraseña antes de crear
  User.beforeCreate(async (user) => {
    // Si no se define ID, genera uno aleatorio
    if (!user.id) {
      user.id = Math.random().toString(36).substring(2, 10);
    }

    // Cifrar contraseña
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  // Cifrar si la contraseña fue modificada
  User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  // Método de instancia para comparar contraseñas
  User.prototype.validarPassword = async function (passwordPlano) {
    return await bcrypt.compare(passwordPlano, this.password);
  };

  return User;
};
