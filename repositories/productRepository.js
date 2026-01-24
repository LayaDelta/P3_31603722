// repositories/productRepository.js - CON MÉTODO findDuplicate AGREGADO
const BaseRepository = require('./baseRepository');
const { Product, Category, Tag, ProductTag } = require('../models');
const { Op } = require('sequelize');

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  // 🔍 NUEVO MÉTODO: Buscar producto duplicado (mismo nombre en misma categoría)
  async findDuplicate(name, categoryId, excludeId = null) {
    try {
      const where = {
        name: {
          [Op.like]: name.trim() // Búsqueda case-insensitive (depende de DB config)
        },
        categoryId: categoryId
      };
      
      // Excluir un ID específico (para updates)
      if (excludeId) {
        where.id = { [Op.ne]: excludeId };
      }
      
      return await Product.findOne({
        where,
        include: [
          { 
            model: Category, 
            as: 'category',
            attributes: ['id', 'name'] // Solo traer datos necesarios
          }
        ],
        attributes: ['id', 'name', 'categoryId', 'slug'] // Solo traer datos necesarios
      });
    } catch (error) {
      console.error('Error en findDuplicate:', error);
      throw error;
    }
  }

  // 🔍 MÉTODO MEJORADO: Actualizar producto con tags (CON VALIDACIÓN DE DUPLICADOS)
  async updateWithTags(id, data) {
    const { tagIds, ...productData } = data;
    
    const transaction = await Product.sequelize.transaction();
    
    try {
      // Buscar producto
      const product = await Product.findByPk(id, { 
        include: [
          { model: Tag, as: 'tags' },
          { model: Category, as: 'category' }
        ],
        transaction 
      });
      
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      // 🔍 VALIDAR DUPLICADO SI CAMBIA EL NOMBRE O CATEGORÍA
      if ((productData.name && productData.name !== product.name) || 
          (productData.categoryId && productData.categoryId !== product.categoryId)) {
        
        const nameToCheck = productData.name || product.name;
        const categoryIdToCheck = productData.categoryId || product.categoryId;
        
        const duplicate = await this.findDuplicate(nameToCheck, categoryIdToCheck, id);
        
        if (duplicate) {
          const categoryName = duplicate.category?.name || 'esta categoría';
          throw new Error(`Ya existe un producto con el nombre "${nameToCheck}" en ${categoryName} (ID: ${duplicate.id})`);
        }
      }
      
      // Actualizar datos del producto
      await product.update(productData, { transaction });
      
      // Actualizar tags si se proporcionan
      if (tagIds !== undefined) {
        let tags = [];
        if (tagIds && tagIds.length > 0) {
          tags = await Tag.findAll({
            where: { id: tagIds },
            transaction
          });
          
          if (tags.length !== tagIds.length) {
            const foundIds = tags.map(t => t.id);
            const missingIds = tagIds.filter(id => !foundIds.includes(id));
            throw new Error(`Tags no encontrados: ${missingIds.join(', ')}`);
          }
        }
        await product.setTags(tags, { transaction });
      }
      
      await transaction.commit();
      
      // Retornar con relaciones
      return await this.findByIdWithRelations(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
        {
          model: Tag,
          as: 'tags',
          through: { model: ProductTag, attributes: [] }
        }
      ]
    });
  }

  // Buscar producto por ID con todas las relaciones
  async findByIdWithRelations(id) {
    return await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        {
          model: Tag,
          as: 'tags',
          through: { model: ProductTag, attributes: [] }
        }
      ]
    });
  }

  // Crear producto con tags
  async createWithTags(data) {
    const { tagIds, ...productData } = data;
    
    const transaction = await Product.sequelize.transaction();
    
    try {
      // 🔍 VALIDAR DUPLICADO ANTES DE CREAR
      if (productData.name && productData.categoryId) {
        const duplicate = await this.findDuplicate(productData.name, productData.categoryId);
        
        if (duplicate) {
          const categoryName = duplicate.category?.name || 'esta categoría';
          throw new Error(`Ya existe un producto con el nombre "${productData.name}" en ${categoryName} (ID: ${duplicate.id})`);
        }
      }
      
      // Crear producto
      const product = await Product.create(productData, { transaction });
      
      // Asignar tags si existen
      if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
        // Validar tags existan
        const tags = await Tag.findAll({
          where: { id: tagIds },
          transaction
        });
        
        if (tags.length !== tagIds.length) {
          const foundIds = tags.map(t => t.id);
          const missingIds = tagIds.filter(id => !foundIds.includes(id));
          throw new Error(`Tags no encontrados: ${missingIds.join(', ')}`);
        }
        
        await product.setTags(tags, { transaction });
      }
      
      await transaction.commit();
      
      // Retornar con relaciones
      return await this.findByIdWithRelations(product.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Consulta avanzada con filtros
  async queryAdvanced(query) {
    return await Product.findAll(query);
  }

  // Contar productos con filtros (MÉTODO AÑADIDO PARA SOLUCIONAR EL ERROR)
  async countWithFilters(query = {}) {
    return await Product.count(query);
  }

  // Buscar productos por múltiples criterios
  async searchProducts(criteria) {
    const { categoryId, tagIds, keyword, minPrice, maxPrice, brand, sector } = criteria;
    
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
        through: { model: ProductTag, attributes: [] },
        where: { id: tagIds },
        required: true
      });
    } else {
      include.push({ 
        model: Tag, 
        as: 'tags', 
        through: { model: ProductTag, attributes: [] } 
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
    
    // Filtro por sector
    if (sector) {
      where.sector = sector;
    }
    
    // Filtro por precio
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    
    return await Product.findAll({
      where,
      include,
      distinct: true
    });
  }

  // Obtener productos relacionados
  async getRelatedProducts(productId, limit = 4) {
    const product = await this.findByIdWithRelations(productId);
    if (!product || !product.tags || !product.tags.length) return [];
    
    const tagIds = product.tags.map(t => t.id);
    
    return await Product.findAll({
      where: {
        id: { [Op.ne]: productId },
        [Op.or]: [
          { categoryId: product.categoryId },
          ...(tagIds.length > 0 ? [{
            '$tags.id$': { [Op.in]: tagIds }
          }] : [])
        ]
      },
      include: [
        { model: Category, as: 'category' },
        {
          model: Tag,
          as: 'tags',
          through: { model: ProductTag, attributes: [] }
        }
      ],
      limit,
      order: Product.sequelize.random()
    });
  }

  // Buscar por criterios específicos (para búsqueda avanzada)
  async findByCriteria(criteria) {
    const { id, tag, category, keyword, exactMatch, brand, minPrice, maxPrice, limit = 20 } = criteria;
    
    const where = {};
    const include = [];
    
    // Filtro por ID exacto
    if (id) {
      where.id = parseInt(id);
    }
    
    // Filtro por categoría (ID o nombre)
    if (category) {
      const isNumeric = /^\d+$/.test(category);
      include.push({
        model: Category,
        as: 'category',
        where: isNumeric ? { id: parseInt(category) } : { name: { [Op.like]: `%${category}%` } }
      });
    } else {
      include.push({ model: Category, as: 'category' });
    }
    
    // Filtro por tag (ID o nombre)
    if (tag) {
      const isNumeric = /^\d+$/.test(tag);
      include.push({
        model: Tag,
        as: 'tags',
        through: { model: ProductTag, attributes: [] },
        where: isNumeric ? { id: parseInt(tag) } : { name: { [Op.like]: `%${tag}%` } },
        required: true
      });
    } else {
      include.push({ 
        model: Tag, 
        as: 'tags', 
        through: { model: ProductTag, attributes: [] } 
      });
    }
    
    // Filtro por palabra clave
    if (keyword) {
      const operator = exactMatch ? Op.eq : Op.like;
      const value = exactMatch ? keyword : `%${keyword}%`;
      
      where[Op.or] = [
        { name: { [operator]: value } },
        { description: { [operator]: value } },
        { brand: { [operator]: value } }
      ];
    }
    
    // Filtros adicionales
    if (brand) {
      where.brand = { [Op.like]: `%${brand}%` };
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    
    return await Product.findAll({
      where,
      include,
      distinct: true,
      limit: parseInt(limit)
    });
  }

  // Obtener todos los productos
  async findAll() {
    return await Product.findAll();
  }

  // 🔍 MÉTODO OPCIONAL: Buscar productos con nombres similares
  async findSimilarNames(name, categoryId = null, threshold = 0.7) {
    const allProducts = await this.findAll();
    
    return allProducts.filter(product => {
      // Filtrar por categoría si se especifica
      if (categoryId && product.categoryId !== categoryId) {
        return false;
      }
      
      // Calcular similitud (implementación simple)
      const similarity = this.calculateSimilarity(name.toLowerCase(), product.name.toLowerCase());
      return similarity >= threshold;
    });
  }

  // 🔍 MÉTODO AUXILIAR: Calcular similitud entre strings
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    // Distancia de Levenshtein simple
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / parseFloat(longer.length);
  }

  levenshteinDistance(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    return track[str2.length][str1.length];
  }
}

module.exports = new ProductRepository();