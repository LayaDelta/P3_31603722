// services/productService.js - VERSIÓN COMPLETA CON VALIDACIÓN ANTI-DUPLICADOS
const { Category, Tag, ProductTag } = require('../models');
const ProductRepository = require('../repositories/productRepository');
const CategoryRepository = require('../repositories/categoryRepository');
const TagRepository = require('../repositories/tagRepository');
const slugify = require('slugify');
const { Op } = require('sequelize');

class ProductService {

  // Crear un nuevo producto CON VALIDACIÓN ANTI-DUPLICADOS
  static async create(data) {
    if (!data || Object.keys(data).length === 0) {
      return { status: 'error', message: 'No se enviaron datos para crear el producto' };
    }

    const { name, price, categoryId, tagIds = [] } = data;

    // Validación obligatoria
    if (!name || !price || !categoryId) {
      return { status: 'error', message: 'Los campos name, price y categoryId son obligatorios' };
    }

    // 🔍 VALIDACIÓN ANTI-DUPLICADOS: Verificar si ya existe un producto con mismo nombre en misma categoría
    try {
      const existingProduct = await ProductRepository.findDuplicate(name, categoryId);
      
      if (existingProduct) {
        const categoryName = existingProduct.category?.name || 'esta categoría';
        return { 
          status: 'error', 
          message: `Ya existe un producto con el nombre "${name}" en ${categoryName}`,
          data: {
            duplicate: {
              id: existingProduct.id,
              name: existingProduct.name,
              categoryId: existingProduct.categoryId,
              categoryName: categoryName
            },
            suggestion: `Usa un nombre diferente o modifica el producto existente (ID: ${existingProduct.id})`
          }
        };
      }
    } catch (error) {
      console.error('Error verificando duplicados:', error);
      // Continuar aunque falle la verificación de duplicados
    }

    // Validar categoría
    const categoryExists = await CategoryRepository.existsById(categoryId);
    if (!categoryExists) {
      return { status: 'error', message: 'La categoría no existe' };
    }

    // Validar tags
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      const existingTags = await TagRepository.findByIds(tagIds);
      if (existingTags.length !== tagIds.length) {
        const existingTagIds = existingTags.map(tag => tag.id);
        const missingTagIds = tagIds.filter(id => !existingTagIds.includes(id));
        return { 
          status: 'error', 
          message: `Los siguientes tags no existen: ${missingTagIds.join(', ')}` 
        };
      }
    }

    // Validar precio
    if (parseFloat(price) <= 0) {
      return { status: 'error', message: 'El precio debe ser mayor a 0' };
    }

    // Validar stock
    if (data.stock !== undefined && parseInt(data.stock) < 0) {
      return { status: 'error', message: 'El stock no puede ser negativo' };
    }

    try {
      // Crear producto con relaciones
      const product = await ProductRepository.createWithTags(data);

      return { 
        status: 'success', 
        data: { product },
        message: 'Producto creado exitosamente'
      };
    } catch (error) {
      console.error('Error al crear producto:', error);
      
      // Manejar errores específicos
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors?.[0]?.path === 'sku') {
          return { 
            status: 'error', 
            message: 'Error al generar SKU único. Intenta nuevamente.'
          };
        }
        if (error.errors?.[0]?.path === 'slug') {
          // Si hay error de slug único, sugerir nombre alternativo
          const suggestionName = await this.generateAlternativeName(name, categoryId);
          return { 
            status: 'error', 
            message: 'El nombre del producto ya existe o es muy similar',
            suggestion: `Intenta con: "${suggestionName}"`,
            autoFix: { name: suggestionName }
          };
        }
      }
      
      // Manejar error de duplicado desde el repository
      if (error.message.includes('Ya existe un producto')) {
        return {
          status: 'error',
          message: error.message
        };
      }
      
      return { 
        status: 'error', 
        message: 'Error al crear el producto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Actualizar producto CON VALIDACIÓN ANTI-DUPLICADOS
  static async update(id, data) {
    if (!id) return { status: 'error', message: 'ID no proporcionado' };
    if (!data || Object.keys(data).length === 0) {
      return { status: 'error', message: 'No se enviaron datos para actualizar' };
    }

    // Verificar si el producto existe
    const productExists = await ProductRepository.existsById(id);
    if (!productExists) {
      return { status: 'error', message: 'Producto no encontrado' };
    }

    // 🔍 VALIDACIÓN ANTI-DUPLICADOS: Verificar si el nuevo nombre crea duplicado
    if (data.name || data.categoryId) {
      try {
        // Obtener producto actual para comparar
        const currentProduct = await ProductRepository.findById(id);
        
        const nameToCheck = data.name || currentProduct.name;
        const categoryIdToCheck = data.categoryId || currentProduct.categoryId;
        
        const duplicate = await ProductRepository.findDuplicate(nameToCheck, categoryIdToCheck, id);
        
        if (duplicate) {
          const categoryName = duplicate.category?.name || 'esta categoría';
          return { 
            status: 'error', 
            message: `Ya existe un producto con el nombre "${nameToCheck}" en ${categoryName}`,
            data: {
              duplicate: {
                id: duplicate.id,
                name: duplicate.name,
                categoryId: duplicate.categoryId,
                categoryName: categoryName
              },
              suggestion: `Usa un nombre diferente o modifica el producto existente (ID: ${duplicate.id})`
            }
          };
        }
      } catch (error) {
        console.error('Error verificando duplicados en update:', error);
      }
    }

    // Validar categoría si viene
    if (data.categoryId) {
      const categoryExists = await CategoryRepository.existsById(data.categoryId);
      if (!categoryExists) {
        return { status: 'error', message: 'La categoría no existe' };
      }
    }

    // Validar precio si viene
    if (data.price !== undefined && parseFloat(data.price) <= 0) {
      return { status: 'error', message: 'El precio debe ser mayor a 0' };
    }

    // Validar stock si viene
    if (data.stock !== undefined && parseInt(data.stock) < 0) {
      return { status: 'error', message: 'El stock no puede ser negativo' };
    }

    // Validar tags si vienen
    if (data.tagIds !== undefined) {
      if (Array.isArray(data.tagIds) && data.tagIds.length > 0) {
        const existingTags = await TagRepository.findByIds(data.tagIds);
        if (existingTags.length !== data.tagIds.length) {
          const existingTagIds = existingTags.map(tag => tag.id);
          const missingTagIds = data.tagIds.filter(id => !existingTagIds.includes(id));
          return { 
            status: 'error', 
            message: `Los siguientes tags no existen: ${missingTagIds.join(', ')}` 
          };
        }
      }
    }

    try {
      // Actualizar producto con tags
      const updatedProduct = await ProductRepository.updateWithTags(id, data);

      return { 
        status: 'success', 
        data: { product: updatedProduct },
        message: 'Producto actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return { 
          status: 'error', 
          message: 'No se puede actualizar: el nombre del producto ya existe'
        };
      }
      
      // Manejar error de duplicado desde el repository
      if (error.message.includes('Ya existe un producto')) {
        return {
          status: 'error',
          message: error.message
        };
      }
      
      if (error.message.includes('no encontrado')) {
        return { status: 'error', message: error.message };
      }
      
      return { 
        status: 'error', 
        message: 'Error al actualizar el producto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Obtener producto por ID
  static async findById(id) {
    if (!id) return { status: 'error', message: 'ID no proporcionado' };

    const product = await ProductRepository.findByIdWithRelations(id);
    if (!product) {
      return { status: 'error', message: 'Producto no encontrado' };
    }

    return { status: 'success', data: { product } };
  }

  // Obtener producto por slug
  static async findBySlug(slug) {
    if (!slug) return { status: 'error', message: 'Slug no proporcionado' };

    const product = await ProductRepository.findBySlug(slug);
    if (!product) {
      return { status: 'error', message: 'Producto no encontrado' };
    }

    return { status: 'success', data: { product } };
  }

  // Eliminar producto
  static async delete(id) {
    if (!id) return { status: 'error', message: 'ID no proporcionado' };

    const productExists = await ProductRepository.existsById(id);
    if (!productExists) {
      return { status: 'error', message: 'Producto no encontrado' };
    }

    try {
      await ProductRepository.delete(id);
      return { status: 'success', message: 'Producto eliminado exitosamente' };
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      return { 
        status: 'error', 
        message: 'Error al eliminar el producto' 
      };
    }
  }

  // Búsqueda pública con filtros
  static async publicSearch(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        tags,
        search,
        brand,
        minPrice,
        maxPrice,
        // sector, // Temporalmente comentado hasta que exista la columna
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = filters;

      // Construir consulta base
      const where = {};
      const include = [];
      
      // Paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Filtro por categoría
      if (category) {
        include.push({
          model: Category,
          as: 'category',
          where: { id: parseInt(category) }
        });
      } else {
        include.push({ model: Category, as: 'category' });
      }
      
      // Filtro por tags
      if (tags) {
        const tagIds = tags.split(',').map(id => parseInt(id.trim()));
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
      
      // Filtro por búsqueda
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { brand: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Filtro por marca
      if (brand) {
        where.brand = { [Op.like]: `%${brand}%` };
      }
      
      // Filtro por sector (TEMPORALMENTE COMENTADO)
      // if (sector) {
      //   where.sector = sector;
      // }
      
      // Filtro por precio
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
        if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
      }

      // Obtener total para paginación
      const total = await ProductRepository.countWithFilters({ where, include, distinct: true });
      
      // Obtener productos con paginación
      const products = await ProductRepository.queryAdvanced({
        where,
        include,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset,
        distinct: true
      });

      const totalPages = Math.ceil(total / parseInt(limit));

      return {
        status: 'success',
        data: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          products,
          filtersApplied: {
            category,
            tags,
            search,
            brand,
            minPrice,
            maxPrice,
            // sector,
            sortBy,
            sortOrder
          }
        }
      };

    } catch (error) {
      console.error('Error en búsqueda pública:', error);
      return { 
        status: 'error', 
        message: 'Error en la búsqueda',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Búsqueda específica por criterios
  static async searchByCriteria(criteria) {
    try {
      const { sector, ...cleanCriteria } = criteria; // Remover sector si viene
      const products = await ProductRepository.findByCriteria(cleanCriteria);

      return {
        status: 'success',
        data: {
          criteria: cleanCriteria,
          count: products.length,
          products
        }
      };
    } catch (error) {
      console.error('Error en búsqueda específica:', error);
      return { 
        status: 'error', 
        message: 'Error en la búsqueda',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Obtener productos relacionados
  static async getRelatedProducts(productId, limit = 4) {
    if (!productId) {
      return { 
        status: 'error', 
        message: 'ID de producto no proporcionado' 
      };
    }

    try {
      const relatedProducts = await ProductRepository.getRelatedProducts(productId, limit);
      
      return {
        status: 'success',
        data: {
          productId,
          relatedProducts,
          count: relatedProducts.length
        }
      };
    } catch (error) {
      console.error('Error obteniendo productos relacionados:', error);
      return { 
        status: 'error', 
        message: 'Error al obtener productos relacionados' 
      };
    }
  }

  // Detectar duplicados en la base de datos (simplificado)
  static async detectDatabaseDuplicates() {
    try {
      const allProducts = await ProductRepository.findAll();
      
      const duplicates = [];
      const seenNames = new Map();
      
      for (const product of allProducts) {
        const key = `${product.name.toLowerCase()}-${product.categoryId}`;
        
        if (seenNames.has(key)) {
          duplicates.push({
            name: product.name,
            categoryId: product.categoryId,
            duplicateIds: [seenNames.get(key), product.id],
            products: [allProducts.find(p => p.id === seenNames.get(key)), product]
          });
        } else {
          seenNames.set(key, product.id);
        }
      }
      
      return {
        status: 'success',
        data: {
          totalProducts: allProducts.length,
          duplicatesFound: duplicates.length,
          duplicates
        }
      };
    } catch (error) {
      console.error('Error detectando duplicados:', error);
      return { 
        status: 'error', 
        message: 'Error al detectar duplicados' 
      };
    }
  }

  // 🔍 NUEVO MÉTODO: Generar nombre alternativo sugerido
  static async generateAlternativeName(name, categoryId, attempt = 1) {
    const suffixes = ['Nuevo', 'Actualizado', 'Mejorado', 'Pro', 'Plus', '2024', 'Edición Especial'];
    const suffix = suffixes[Math.min(attempt - 1, suffixes.length - 1)] || `V${attempt}`;
    
    const alternativeName = attempt === 1 ? `${name} ${suffix}` : `${name} ${suffix} ${attempt}`;
    
    // Verificar si el nombre alternativo también existe
    try {
      const exists = await ProductRepository.findDuplicate(alternativeName, categoryId);
      
      if (exists && attempt < 10) {
        return await this.generateAlternativeName(name, categoryId, attempt + 1);
      }
    } catch (error) {
      console.error('Error verificando nombre alternativo:', error);
    }
    
    return alternativeName;
  }

  // 🔍 NUEVO MÉTODO: Buscar productos similares por nombre
  static async findSimilarProducts(name, categoryId = null, threshold = 0.7) {
    try {
      const allProducts = await ProductRepository.findAll();
      
      const similarProducts = allProducts.filter(product => {
        // Si se especifica categoría, filtrar por ella
        if (categoryId && product.categoryId !== categoryId) {
          return false;
        }
        
        // Calcular similitud (implementación simple)
        const similarity = this.calculateNameSimilarity(name, product.name);
        return similarity >= threshold;
      });
      
      return {
        status: 'success',
        data: {
          originalName: name,
          categoryId: categoryId,
          threshold: threshold,
          similarProducts: similarProducts.map(p => ({
            id: p.id,
            name: p.name,
            categoryId: p.categoryId,
            similarity: this.calculateNameSimilarity(name, p.name)
          }))
        }
      };
    } catch (error) {
      console.error('Error buscando productos similares:', error);
      return { 
        status: 'error', 
        message: 'Error buscando productos similares' 
      };
    }
  }

  // 🔍 MÉTODO AUXILIAR: Calcular similitud entre nombres
  static calculateNameSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().replace(/\s+/g, '');
    const s2 = str2.toLowerCase().replace(/\s+/g, '');
    
    if (s1 === s2) return 1.0;
    
    // Método simple: porcentaje de coincidencia de caracteres
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        matches++;
      }
    }
    
    return matches / longer.length;
  }
}

module.exports = ProductService;