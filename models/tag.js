const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Modelo Tag: representa una etiqueta asociada a productos
  const Tag = sequelize.define(
    'Tag',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // Nombre de la etiqueta
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
    },
    {
      tableName: 'tags',
      timestamps: true,
    }
  );

  return Tag;
};
