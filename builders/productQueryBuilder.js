const { Op } = require('sequelize');
const { Category, Tag } = require('../models');

class ProductQueryBuilder {
  constructor() {
    // Objeto base de la consulta que se construirá paso a paso
    this.query = {
      where: {},
      include: [],
      limit: undefined,
      offset: undefined,
    };
  }

  // Filtra productos por categoría específica
  filterByCategory(categoryId) {
    if (!categoryId) return this;

    this.query.include.push({
      model: Category,
      as: 'category', // alias definido en la relación del modelo Product
      where: { id: categoryId },
    });

    return this;
  }

  // Filtra productos que tengan ciertos tags (muchos a muchos)
  filterByTags(tagIds) {
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) return this;

    this.query.include.push({
      model: Tag,
      as: 'tags', // alias definido en la relación belongsToMany
      through: { attributes: [] }, // evita traer datos de la tabla pivote
      where: { id: tagIds },
      required: true, // INNER JOIN → solo productos que tengan esos tags
    });

    return this;
  }

  // Filtra productos por rango de precio mínimo y/o máximo
  filterByPrice(min, max) {
    if (min) {
      this.query.where.price = {
        ...this.query.where.price,
        [Op.gte]: min, // precio >= min
      };
    }

    if (max) {
      this.query.where.price = {
        ...this.query.where.price,
        [Op.lte]: max, // precio <= max
      };
    }

    return this;
  }

  // Busca productos por texto en nombre o descripción
  search(text) {
    if (!text) return this;

    this.query.where[Op.or] = [
      { name: { [Op.like]: `%${text}%` } },
      { description: { [Op.like]: `%${text}%` } },
    ];

    return this;
  }

  // Filtra por marca
  filterByBrand(brand) {
    if (brand) {
      this.query.where.brand = { [Op.like]: `%${brand}%` };
    }
    return this;
  }

  // Filtra por modelo
  filterByModel(model) {
    if (model) {
      this.query.where.model = { [Op.like]: `%${model}%` };
    }
    return this;
  }

  // Aplica paginación a la consulta
  paginate(page = 1, limit = 10) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    this.query.limit = limitNum;
    this.query.offset = (pageNum - 1) * limitNum;

    return this;
  }

  // Devuelve el objeto final de consulta para usarlo en Sequelize
  build() {
    return this.query;
  }
}

module.exports = ProductQueryBuilder;
