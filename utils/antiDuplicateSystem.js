// utils/antiDuplicateSystem.js
const ProductRepository = require('../repositories/productRepository');
const { Op } = require('sequelize');

/**
 * SISTEMA ANTI-DUPLICADOS MODULAR
 * 
 * Este sistema puede ser usado como:
 * 1. Hook/middleware para validaciones
 * 2. Servicio independiente
 * 3. Mixin para otras clases
 */

class AntiDuplicateSystem {
  
  constructor(repository = ProductRepository) {
    this.repository = repository;
    this.duplicateTypes = {
      NAME: 'name',
      NAME_CATEGORY: 'name_category',
      SLUG: 'slug',
      SKU: 'sku'
    };
  }

  /**
   * Configuración del sistema
   */
  config(options = {}) {
    this.config = {
      caseSensitive: false,
      trimSpaces: true,
      excludeFields: [],
      severityLevels: {
        critical: ['name_category', 'sku'],
        high: ['name', 'slug'],
        medium: [],
        low: []
      },
      ...options
    };
    return this;
  }

  /**
   * Normaliza los valores para comparación
   */
  normalizeValue(value, field) {
    if (!value) return value;
    
    let normalized = value.toString();
    
    if (this.config.trimSpaces) {
      normalized = normalized.trim();
    }
    
    if (!this.config.caseSensitive && typeof normalized === 'string') {
      normalized = normalized.toLowerCase();
    }
    
    return normalized;
  }

  /**
   * Verifica múltiples tipos de duplicados
   */
  async checkForDuplicates(data, excludeId = null) {
    const checks = [
      this.checkNameDuplicate(data, excludeId),
      this.checkNameCategoryDuplicate(data, excludeId),
      this.checkSlugDuplicate(data, excludeId),
      this.checkSkuDuplicate(data, excludeId)
    ];

    const results = await Promise.all(checks);
    return results.filter(result => result !== null);
  }

  /**
   * Verifica duplicado por nombre
   */
  async checkNameDuplicate(data, excludeId = null) {
    if (!data.name || this.config.excludeFields.includes('name')) {
      return null;
    }

    const normalizedName = this.normalizeValue(data.name, 'name');
    const products = await this.repository.findAll();
    
    const duplicate = products.find(product => {
      if (excludeId && product.id === excludeId) return false;
      
      const productName = this.normalizeValue(product.name, 'name');
      return productName === normalizedName;
    });

    if (duplicate) {
      return {
        type: this.duplicateTypes.NAME,
        field: 'nombre',
        value: data.name,
        existingId: duplicate.id,
        severity: 'high',
        message: `Ya existe un producto con el nombre "${data.name}" (ID: ${duplicate.id})`
      };
    }

    return null;
  }

  /**
   * Verifica duplicado por nombre + categoría (combinación única)
   */
  async checkNameCategoryDuplicate(data, excludeId = null) {
    if (!data.name || !data.categoryId || 
        this.config.excludeFields.includes('name') || 
        this.config.excludeFields.includes('categoryId')) {
      return null;
    }

    const normalizedName = this.normalizeValue(data.name, 'name');
    const products = await this.repository.findAll();
    
    const duplicate = products.find(product => {
      if (excludeId && product.id === excludeId) return false;
      
      const productName = this.normalizeValue(product.name, 'name');
      return productName === normalizedName && product.categoryId === data.categoryId;
    });

    if (duplicate) {
      return {
        type: this.duplicateTypes.NAME_CATEGORY,
        field: 'nombre y categoría',
        value: `${data.name} en categoría ${data.categoryId}`,
        existingId: duplicate.id,
        severity: 'critical',
        message: `Ya existe un producto con el nombre "${data.name}" en la misma categoría (ID: ${duplicate.id})`
      };
    }

    return null;
  }

  /**
   * Verifica duplicado por slug
   */
  async checkSlugDuplicate(data, excludeId = null) {
    if (!data.slug || this.config.excludeFields.includes('slug')) {
      return null;
    }

    const normalizedSlug = this.normalizeValue(data.slug, 'slug');
    const product = await this.repository.findBySlug(normalizedSlug);
    
    if (product && (!excludeId || product.id !== excludeId)) {
      return {
        type: this.duplicateTypes.SLUG,
        field: 'slug',
        value: data.slug,
        existingId: product.id,
        severity: 'high',
        message: `Ya existe un producto con el slug "${data.slug}" (ID: ${product.id})`
      };
    }

    return null;
  }

  /**
   * Verifica duplicado por SKU
   */
  async checkSkuDuplicate(data, excludeId = null) {
    if (!data.sku || this.config.excludeFields.includes('sku')) {
      return null;
    }

    const products = await this.repository.findAll();
    const duplicate = products.find(product => {
      if (excludeId && product.id === excludeId) return false;
      return product.sku === data.sku;
    });

    if (duplicate) {
      return {
        type: this.duplicateTypes.SKU,
        field: 'SKU',
        value: data.sku,
        existingId: duplicate.id,
        severity: 'critical',
        message: `Ya existe un producto con el SKU "${data.sku}" (ID: ${duplicate.id})`
      };
    }

    return null;
  }

  /**
   * Valida si hay duplicados y retorna error si los hay
   */
  async validateNoDuplicates(data, excludeId = null) {
    const duplicates = await this.checkForDuplicates(data, excludeId);
    
    if (duplicates.length === 0) {
      return { isValid: true };
    }

    // Ordenar por severidad (crítico primero)
    duplicates.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const duplicate = duplicates[0];
    
    return {
      isValid: false,
      error: {
        status: 'fail',
        message: duplicate.message,
        duplicate: {
          type: duplicate.type,
          field: duplicate.field,
          value: duplicate.value,
          existingId: duplicate.existingId,
          severity: duplicate.severity,
          suggestion: this.getSuggestion(duplicate.type, data)
        }
      }
    };
  }

  /**
   * Genera sugerencias basadas en el tipo de duplicado
   */
  getSuggestion(type, data) {
    const suggestions = {
      [this.duplicateTypes.NAME]: 
        `Intenta con: "${data.name} 2", "${data.name} - ${data.brand || 'nuevo'}" o "${data.name} ${new Date().getFullYear()}"`,
      
      [this.duplicateTypes.NAME_CATEGORY]:
        'No puedes tener el mismo nombre en la misma categoría. Cambia el nombre o selecciona una categoría diferente.',
      
      [this.duplicateTypes.SLUG]:
        'El slug se generará automáticamente con un número secuencial.',
      
      [this.duplicateTypes.SKU]:
        'El SKU debe ser único. Genera uno nuevo o usa un sistema de codificación.'
    };

    return suggestions[type] || 'Por favor, revisa los datos e intenta con valores diferentes.';
  }

  /**
   * Genera un nombre único evitando duplicados
   */
  async generateUniqueName(baseName, categoryId = null, excludeId = null) {
    if (!baseName) return baseName;

    let uniqueName = baseName;
    let counter = 1;
    let maxAttempts = 100;

    while (counter <= maxAttempts) {
      const checkResult = await this.checkNameDuplicate({ name: uniqueName }, excludeId);
      
      // Si hay categoría, también verificar combinación nombre+categoría
      let categoryCheckResult = null;
      if (categoryId) {
        categoryCheckResult = await this.checkNameCategoryDuplicate(
          { name: uniqueName, categoryId }, 
          excludeId
        );
      }

      // Si no hay duplicados o el duplicado es el producto excluido
      if ((!checkResult || (excludeId && checkResult.existingId === excludeId)) &&
          (!categoryCheckResult || (excludeId && categoryCheckResult.existingId === excludeId))) {
        return uniqueName;
      }

      // Generar nuevo nombre
      if (counter === 1) {
        uniqueName = `${baseName} (${counter})`;
      } else {
        uniqueName = `${baseName} (${counter})`;
      }
      
      counter++;
    }

    // Si llegamos aquí, usar timestamp
    return `${baseName}_${Date.now()}`;
  }

  /**
   * Hook para usar antes de crear
   */
  async beforeCreate(data) {
    return await this.validateNoDuplicates(data);
  }

  /**
   * Hook para usar antes de actualizar
   */
  async beforeUpdate(id, data) {
    return await this.validateNoDuplicates(data, id);
  }

  /**
   * Filtra resultados eliminando duplicados
   */
  filterDuplicatesFromResults(products, keyField = 'name', secondaryField = 'categoryId') {
    const seen = new Map();
    const uniqueProducts = [];

    products.forEach(product => {
      const key = secondaryField 
        ? `${this.normalizeValue(product[keyField], keyField)}-${product[secondaryField]}`
        : this.normalizeValue(product[keyField], keyField);

      if (!seen.has(key)) {
        seen.set(key, product);
        uniqueProducts.push(product);
      } else {
        // Opcional: mantener el más reciente
        const existing = seen.get(key);
        if (new Date(product.createdAt) > new Date(existing.createdAt)) {
          seen.set(key, product);
          const index = uniqueProducts.findIndex(p => p === existing);
          if (index > -1) {
            uniqueProducts[index] = product;
          }
        }
      }
    });

    return {
      filtered: uniqueProducts,
      removed: products.length - uniqueProducts.length,
      duplicatesFound: products.length !== uniqueProducts.length
    };
  }

  /**
   * Detección masiva de duplicados en la base de datos
   */
  async detectAllDuplicates() {
    const products = await this.repository.findAll();
    const duplicatesMap = new Map();

    // Agrupar por nombre + categoría
    products.forEach(product => {
      const key = `${this.normalizeValue(product.name, 'name')}-${product.categoryId}`;
      if (!duplicatesMap.has(key)) {
        duplicatesMap.set(key, []);
      }
      duplicatesMap.get(key).push(product);
    });

    // Filtrar grupos con duplicados
    const duplicateGroups = [];
    for (const [key, group] of duplicatesMap.entries()) {
      if (group.length > 1) {
        duplicateGroups.push({
          key,
          count: group.length,
          products: group.map(p => ({
            id: p.id,
            name: p.name,
            categoryId: p.categoryId,
            createdAt: p.createdAt,
            slug: p.slug
          })),
          suggestion: `Consolidar en un solo producto o eliminar ${group.length - 1} duplicado(s)`
        });
      }
    }

    return {
      totalProducts: products.length,
      duplicateGroups: duplicateGroups.length,
      groups: duplicateGroups,
      summary: `Se encontraron ${duplicateGroups.length} grupos con productos duplicados`
    };
  }

  /**
   * Middleware para Express
   */
  middleware(type = 'create') {
    return async (req, res, next) => {
      try {
        const data = req.body;
        const excludeId = type === 'update' ? req.params.id : null;
        
        const validation = await this.validateNoDuplicates(data, excludeId);
        
        if (!validation.isValid) {
          return res.status(409).json(validation.error); // 409 Conflict
        }
        
        // Agregar validación al request para uso posterior
        req.duplicateValidation = validation;
        next();
      } catch (error) {
        console.error('Error en middleware anti-duplicados:', error);
        res.status(500).json({
          status: 'error',
          message: 'Error validando duplicados'
        });
      }
    };
  }

  /**
   * Factory para crear instancias preconfiguradas
   */
  static create(config = {}) {
    const instance = new AntiDuplicateSystem();
    return instance.config(config);
  }
}

// Exportar instancia por defecto
const defaultAntiDuplicate = new AntiDuplicateSystem().config();

module.exports = {
  AntiDuplicateSystem,
  defaultAntiDuplicate,
  createAntiDuplicate: (config) => AntiDuplicateSystem.create(config)
};