const BaseRepository = require('./baseRepository');
const { Product, Category, Tag } = require('../models');
const { Op } = require('sequelize');

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  // Obtener producto por ID con relaciones (Category + Tags) 
  async findByIdWithRelations(id) {
    return await Product.findOne({
      where: { id },
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } }
      ]
    });
  }

  // Verifica si existe un producto por slug 
  async slugExists(slug, excludeId = null) {
    return await Product.findOne({
      where: excludeId
        ? { slug, id: { [Op.ne]: excludeId } }
        : { slug }
    });
  }

  // Búsqueda avanzada usando QueryBuilder
  async search(query) {
    return await Product.findAndCountAll({
      ...query,
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } }
      ]
    });
  }

  // Consultas avanzadas usando query-builder completo 
  async queryAdvanced(query) {
    return await Product.findAndCountAll(query);
  }

  // Asignar categoría 
  async assignCategory(productId, categoryId) {
    const product = await Product.findByPk(productId);
    if (!product) return null;

    product.categoryId = categoryId;
    await product.save();
    return product;
  }

  // Asignar tag  
  async assignTags(productId, tagIds) {
    const product = await Product.findByPk(productId);
    if (!product) return null;

    const tags = await Tag.findAll({ where: { id: tagIds } });
    await product.setTags(tags);
    return product;
  }

  
  // Crear producto con categoría y tags asociados 

  async createWithRelations(data) {
    const { categoryId, tagIds = [], ...productData } = data;

    // Crear el producto
    const product = await Product.create({
      ...productData,
      categoryId: categoryId || null
    });

    // Asignar tags si vienen
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      await this.assignTags(product.id, tagIds);
    }

    // Devolver el producto con relaciones cargadas
    return await this.findByIdWithRelations(product.id);
  }
}

module.exports = new ProductRepository();
