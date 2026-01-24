const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductTag = sequelize.define('ProductTag', {
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
  }, {
    tableName: 'ProductTags',
    timestamps: true,
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ['productId', 'tagId'],
        name: 'product_tag_unique'
      }
    ]
  });

  return ProductTag;
};