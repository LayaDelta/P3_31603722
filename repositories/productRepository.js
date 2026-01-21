// repositories/productRepository.js
const BaseRepository = require('./baseRepository');
const { Product, Category, Tag } = require('../models');
const { Op } = require('sequelize');

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  // Buscar producto por nombre
  async findByName(name) {
    return await Product.findOne({
      where: {
        name: name.trim(),
      },
    });
  }

  // Buscar producto por slug
  async findBySlug(slug) {
    return await Product.findOne({
      where: { slug },
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags' }
      ]
    });
  }

  // Buscar producto por ID con todas las relaciones
  async findByIdWithRelations(id) {
    return await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } }
      ]
    });
  }

  // Crear producto con tags
  async createWithTags(data) {
    const { tagIds, ...productData } = data;
    
    const transaction = await Product.sequelize.transaction();
    
    try {
      // Crear producto
      const product = await Product.create(productData, { transaction });
      
      // Asignar tags si existen
      if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
        const tags = await Tag.findAll({
          where: { id: tagIds },
          transaction
        });
        await product.setTags(tags, { transaction });
      }
      
      await transaction.commit();
      return product;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Actualizar producto con tags
  async updateWithTags(id, data) {
    const { tagIds, ...productData } = data;
    
    const transaction = await Product.sequelize.transaction();
    
    try {
      // Buscar producto
      const product = await Product.findByPk(id, { transaction });
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      // Actualizar datos del producto
      await product.update(productData, { transaction });
      
      // Actualizar tags si se proporcionan
      if (tagIds !== undefined) {
        const tags = tagIds && tagIds.length > 0 
          ? await Tag.findAll({
              where: { id: tagIds },
              transaction
            })
          : [];
        await product.setTags(tags, { transaction });
      }
      
      await transaction.commit();
      return product;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Consulta avanzada con filtros
  async queryAdvanced(query) {
    return await Product.findAll(query);
  }

  // Contar productos con filtros
  async countWithFilters(query) {
    return await Product.count(query);
  }

  // Buscar productos por múltiples criterios
  async searchProducts(criteria) {
    const { categoryId, tagIds, keyword, minPrice, maxPrice, brand } = criteria;
    
    const where = {};
    const include = [];
    
    // Filtro por categoría
    if (categoryId) {
      include.push({
        model: Category,
        as: 'category',
        where: { id: categoryId }
      });
    } else {
      include.push({ model: Category, as: 'category' });
    }
    
    // Filtro por tags
    if (tagIds && tagIds.length > 0) {
      include.push({
        model: Tag,
        as: 'tags',
        through: { attributes: [] },
        where: { id: tagIds },
        required: true
      });
    } else {
      include.push({ 
        model: Tag, 
        as: 'tags', 
        through: { attributes: [] } 
      });
    }
    
    // Filtro por palabra clave
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { brand: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    // Filtro por marca
    if (brand) {
      where.brand = { [Op.like]: `%${brand}%` };
    }
    
    // Filtro por precio
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }
    
    return await Product.findAll({
      where,
      include,
      distinct: true
    });
  }

  // Verificar si existe un producto por ID
  async existsById(id) {
    const count = await Product.count({ where: { id } });
    return count > 0;
  }

  // Obtener productos relacionados (misma categoría o tags)
  async getRelatedProducts(productId, limit = 4) {
    const product = await this.findByIdWithRelations(productId);
    if (!product) return [];
    
    return await Product.findAll({
      where: {
        id: { [Op.ne]: productId },
        [Op.or]: [
          { categoryId: product.categoryId },
          { '$tags.id$': { [Op.in]: product.tags.map(t => t.id) } }
        ]
      },
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } }
      ],
      limit,
      order: [[Product.sequelize.random()]] // Orden aleatorio
    });
  }
}

module.exports = new ProductRepository();