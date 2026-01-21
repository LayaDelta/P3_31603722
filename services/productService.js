// services/productService.js (SIMPLIFICADO CON HOOKS)
const { Category, Tag } = require('../models');
const ProductRepository = require('../repositories/productRepository');
const CategoryRepository = require('../repositories/categoryRepository');
const TagRepository = require('../repositories/tagRepository');
const { defaultAntiDuplicate } = require('../utils/antiDuplicateSystem');
const slugify = require('slugify');
const { Op } = require('sequelize');

class ProductService {

  // Instancia configurada del sistema anti-duplicados
  static antiDuplicate = defaultAntiDuplicate;

  // Configurar sistema anti-duplicados (opcional)
  static configureAntiDuplicate(config) {
    this.antiDuplicate = this.antiDuplicate.config(config);
  }

  // Genera un slug único basado en el nombre
  static async generateUniqueSlug(name, productId = null) {
    if (!name) return null;

    let baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Verificar con el sistema anti-duplicados
    const checkResult = await this.antiDuplicate.checkSlugDuplicate({ slug }, productId);
    
    while (checkResult && (!productId || checkResult.existingId !== productId)) {
      slug = `${baseSlug}-${counter}`;
      const newCheck = await this.antiDuplicate.checkSlugDuplicate({ slug }, productId);
      if (!newCheck || (productId && newCheck.existingId === productId)) break;
      counter++;
      
      if (counter > 100) {
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }

    return slug;
  }

  // Crear un nuevo producto
  static async create(data) {
    if (!data || Object.keys(data).length === 0) {
      return { status: 'fail', message: 'No se enviaron datos para crear el producto' };
    }

    const { name, price, categoryId, tagIds = [] } = data;

    // Validación obligatoria
    if (!name || !price || !categoryId) {
      return { status: 'fail', message: 'Los campos name, price y categoryId son obligatorios' };
    }

    // 🔍 VALIDAR DUPLICADOS CON EL SISTEMA
    const duplicateValidation = await this.antiDuplicate.beforeCreate(data);
    if (!duplicateValidation.isValid) {
      return duplicateValidation.error;
    }

    // Validar categoría
    const categoryExists = await CategoryRepository.existsById(categoryId);
    if (!categoryExists) {
      return { status: 'fail', message: 'La categoría no existe' };
    }

    // Validar tags
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      const existingTags = await TagRepository.findByIds(tagIds);
      if (existingTags.length !== tagIds.length) {
        const existingTagIds = existingTags.map(tag => tag.id);
        const missingTagIds = tagIds.filter(id => !existingTagIds.includes(id));
        return { 
          status: 'fail', 
          message: `Los siguientes tags no existen: ${missingTagIds.join(', ')}` 
        };
      }
    }

    // Generar slug único
    const slug = await this.generateUniqueSlug(name);

    try {
      // Crear producto con relaciones
      const product = await ProductRepository.createWithTags({
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock || 0,
        brand: data.brand,
        categoryId: data.categoryId,
        slug,
        tagIds: tagIds
      });

      // Obtener producto completo con relaciones
      const productWithRelations = await ProductRepository.findByIdWithRelations(product.id);

      return { 
        status: 'success', 
        data: { product: productWithRelations },
        message: 'Producto creado exitosamente'
      };
    } catch (error) {
      console.error('Error al crear producto:', error);
      
      // Si hay error de constraint, usar sistema anti-duplicados para sugerir solución
      if (error.name === 'SequelizeUniqueConstraintError') {
        const uniqueName = await this.antiDuplicate.generateUniqueName(name, categoryId);
        return { 
          status: 'fail', 
          message: 'Ya existe un producto con esos datos',
          suggestion: `Intenta con: "${uniqueName}"`,
          autoFix: { name: uniqueName }
        };
      }
      
      return { 
        status: 'error', 
        message: 'Error al crear el producto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Actualizar producto
  static async update(id, data) {
    if (!id) return { status: 'fail', message: 'ID no proporcionado' };
    if (!data || Object.keys(data).length === 0) {
      return { status: 'fail', message: 'No se enviaron datos para actualizar' };
    }

    // Verificar si el producto existe
    const productExists = await ProductRepository.existsById(id);
    if (!productExists) {
      return { status: 'fail', message: 'Producto no encontrado' };
    }

    // Obtener producto actual
    const currentProduct = await ProductRepository.findById(id);

    // Si cambia el nombre, actualizar slug
    if (data.name && data.name !== currentProduct.name) {
      data.slug = await this.generateUniqueSlug(data.name, id);
    }

    // Validar categoría si viene
    if (data.categoryId) {
      const categoryExists = await CategoryRepository.existsById(data.categoryId);
      if (!categoryExists) {
        return { status: 'fail', message: 'La categoría no existe' };
      }
    }

    // Validar tags si vienen
    if (data.tagIds !== undefined) {
      if (Array.isArray(data.tagIds) && data.tagIds.length > 0) {
        const existingTags = await TagRepository.findByIds(data.tagIds);
        if (existingTags.length !== data.tagIds.length) {
          const existingTagIds = existingTags.map(tag => tag.id);
          const missingTagIds = data.tagIds.filter(id => !existingTagIds.includes(id));
          return { 
            status: 'fail', 
            message: `Los siguientes tags no existen: ${missingTagIds.join(', ')}` 
          };
        }
      }
    }

    // 🔍 VALIDAR DUPLICADOS CON EL SISTEMA
    const duplicateValidation = await this.antiDuplicate.beforeUpdate(id, data);
    if (!duplicateValidation.isValid) {
      return duplicateValidation.error;
    }

    try {
      // Actualizar producto con tags
      const updatedProduct = await ProductRepository.updateWithTags(id, data);
      const productWithRelations = await ProductRepository.findByIdWithRelations(id);

      return { 
        status: 'success', 
        data: { product: productWithRelations },
        message: 'Producto actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        // Sugerir nombre único usando el sistema
        const uniqueName = await this.antiDuplicate.generateUniqueName(
          data.name || currentProduct.name, 
          data.categoryId || currentProduct.categoryId, 
          id
        );
        return { 
          status: 'fail', 
          message: 'No se puede actualizar: conflicto de datos',
          suggestion: `Intenta con: "${uniqueName}"`,
          autoFix: { name: uniqueName }
        };
      }
      
      return { 
        status: 'error', 
        message: 'Error al actualizar el producto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Buscar o crear producto (usando sistema anti-duplicados)
  static async findOrCreate(productData) {
    const { name, categoryId } = productData;
    
    if (!name || !categoryId) {
      return { status: 'fail', message: 'Nombre y categoría son requeridos' };
    }

    try {
      // Primero verificar si ya existe usando el sistema
      const duplicateCheck = await this.antiDuplicate.checkNameCategoryDuplicate(
        { name, categoryId }
      );

      if (duplicateCheck) {
        // Producto encontrado, devolverlo
        const existingProduct = await ProductRepository.findByIdWithRelations(duplicateCheck.existingId);
        return {
          status: 'success',
          data: { product: existingProduct },
          created: false,
          message: 'Producto encontrado (evitado duplicado)',
          duplicatePrevented: true
        };
      }

      // Si no existe, crear con validación automática
      const createResult = await this.create(productData);
      
      if (createResult.status === 'success') {
        return {
          ...createResult,
          created: true,
          duplicatePrevented: false
        };
      }
      
      return createResult;

    } catch (error) {
      console.error('Error en findOrCreate:', error);
      return { 
        status: 'error', 
        message: 'Error en búsqueda/creación' 
      };
    }
  }

  // BÚSQUEDA PÚBLICA CON FILTRADO (usando sistema anti-duplicados)
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
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        excludeDuplicates = true // Usar sistema anti-duplicados
      } = filters;

      // Construir consulta base
      const query = {
        where: {},
        include: [],
        order: [[sortBy, sortOrder.toUpperCase()]],
        distinct: true
      };

      // ... (todo el código de filtrado permanece igual) ...

      // Obtener productos
      const products = await ProductRepository.queryAdvanced(query);

      // 🔍 FILTRAR DUPLICADOS USANDO EL SISTEMA
      let finalProducts = products;
      let duplicatesRemoved = 0;
      
      if (excludeDuplicates) {
        const filterResult = this.antiDuplicate.filterDuplicatesFromResults(products, 'name', 'categoryId');
        finalProducts = filterResult.filtered;
        duplicatesRemoved = filterResult.removed;
      }

      const totalPages = Math.ceil(products.length / limit);

      return {
        status: 'success',
        data: {
          total: products.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          products: finalProducts,
          duplicatesRemoved,
          filtersApplied: {
            // ... filtros aplicados ...
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

  // Detectar duplicados en la base de datos
  static async detectDatabaseDuplicates() {
    return await this.antiDuplicate.detectAllDuplicates();
  }

  // Obtener producto por ID (sin cambios)
  static async findById(id) {
    if (!id) return { status: 'fail', message: 'ID no proporcionado' };

    const product = await ProductRepository.findByIdWithRelations(id);
    if (!product) {
      return { status: 'fail', message: 'Producto no encontrado' };
    }

    return { status: 'success', data: { product } };
  }

  // Eliminar producto (sin cambios)
  static async delete(id) {
    if (!id) return { status: 'fail', message: 'ID no proporcionado' };

    const productExists = await ProductRepository.existsById(id);
    if (!productExists) {
      return { status: 'fail', message: 'Producto no encontrado' };
    }

    try {
      await ProductRepository.delete(id);
      return { status: 'success', message: 'Producto eliminado' };
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      return { 
        status: 'error', 
        message: 'Error al eliminar el producto' 
      };
    }
  }

  // Self-Healing URL (sin cambios)
  static async publicFindByIdAndSlug(id, slug) {
    if (!id || !slug) {
      return { 
        status: 'fail', 
        message: 'ID o slug no proporcionado' 
      };
    }

    const product = await ProductRepository.findByIdWithRelations(id);
    if (!product) {
      return { 
        status: 'fail', 
        message: 'Producto no encontrado' 
      };
    }

    if (product.slug !== slug) {
      return {
        redirect: true,
        correctUrl: `/products/p/${product.id}-${product.slug}`,
        status: 'success',
        data: { product }
      };
    }

    return { 
      status: 'success', 
      data: { product } 
    };
  }

  // Productos relacionados (usando sistema anti-duplicados)
  static async getRelatedProducts(productId, limit = 4) {
    if (!productId) {
      return { 
        status: 'fail', 
        message: 'ID de producto no proporcionado' 
      };
    }

    try {
      const relatedProducts = await ProductRepository.getRelatedProducts(productId, limit);
      
      // Eliminar duplicados usando el sistema
      const filterResult = this.antiDuplicate.filterDuplicatesFromResults(relatedProducts, 'name', 'categoryId');
      
      return {
        status: 'success',
        data: {
          productId,
          relatedProducts: filterResult.filtered,
          duplicatesRemoved: filterResult.removed
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
}

module.exports = ProductService;