// builders/productQueryBuilder.js - VERSIÓN FINAL
const { Op } = require('sequelize');
const { Category, Tag } = require('../models');

class ProductQueryBuilder {
  constructor() {
    this.query = {
      where: {},
      include: [],
      limit: undefined,
      offset: undefined,
    };
    console.log('🔍 ProductQueryBuilder inicializado');
  }

  // Filtra productos por categoría específica
  // builders/productQueryBuilder.js - CORRECCIÓN
filterByCategory(categoryId) {
  if (!categoryId) return this;

  console.log(`🔍 Filtrando por categoría ID: ${categoryId}`);
  
  // VERIFICAR: Si ya existe una relación category, eliminarla
  const existingIndex = this.query.include.findIndex(inc => inc.as === 'category');
  if (existingIndex !== -1) {
    this.query.include.splice(existingIndex, 1);
  }
  
  // Agregar la relación SIN where dentro del include
  this.query.include.push({
    model: Category,
    as: 'category',
    attributes: ['id', 'name', 'slug'],  // Solo los campos que necesitas
    required: false  // LEFT JOIN
  });
  
  // En su lugar, filtrar en el WHERE principal
  this.query.where.categoryId = categoryId;

  return this;
}

  // Filtra productos que tengan ciertos tags
  filterByTags(tagIds) {
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) return this;

    console.log(`🔍 Filtrando por tags: ${tagIds.join(', ')}`);
    
    this.query.include.push({
      model: Tag,
      as: 'tags', // minúscula
      through: { attributes: [] },
      where: { id: tagIds },
      required: false
    });

    return this;
  }

  // Filtra productos por rango de precio mínimo y/o máximo
  filterByPrice(min, max) {
    if (min || max) {
      console.log(`🔍 Filtrando por precio: ${min || 'min'} - ${max || 'max'}`);
      
      this.query.where.price = {};
      
      if (min) {
        this.query.where.price[Op.gte] = parseFloat(min);
      }
      
      if (max) {
        this.query.where.price[Op.lte] = parseFloat(max);
      }
    }

    return this;
  }

  // Busca productos por texto en nombre o descripción
  search(text) {
    if (!text || text.trim() === '') return this;

    console.log(`🔍 Buscando: "${text}"`);
    
    this.query.where[Op.or] = [
      { name: { [Op.like]: `%${text}%` } },
      { description: { [Op.like]: `%${text}%` } },
    ];

    return this;
  }

  // Filtra por marca (tu modelo NO tiene campo 'brand' - IGNORADO)
  filterByBrand(brand) {
    if (brand && brand.trim() !== '') {
      console.log(`⚠️  Advertencia: Modelo Product no tiene campo 'brand', ignorando filtro: "${brand}"`);
      // NO filtramos porque el campo no existe en el modelo
    }
    return this;
  }

  // Filtra por modelo (tu modelo NO tiene campo 'model' - IGNORADO)
  filterByModel(model) {
    if (model && model.trim() !== '') {
      console.log(`⚠️  Advertencia: Modelo Product no tiene campo 'model', ignorando filtro: "${model}"`);
      // NO filtramos porque el campo no existe en el modelo
    }
    return this;
  }

  // Filtra por sector (tu modelo NO tiene campo 'sector' - IGNORADO)
  filterBySector(sector) {
    if (sector && sector.trim() !== '') {
      console.log(`⚠️  Advertencia: Modelo Product no tiene campo 'sector', ignorando filtro: "${sector}"`);
      // NO filtramos porque el campo no existe en el modelo
    }
    return this;
  }

  // Filtra por SKU (tu modelo SÍ tiene campo 'sku')
  filterBySku(sku) {
    if (sku && sku.trim() !== '') {
      console.log(`🔍 Filtrando por SKU: "${sku}"`);
      this.query.where.sku = { [Op.like]: `%${sku.trim()}%` };
    }
    return this;
  }

  // Filtra por stock mínimo (tu modelo SÍ tiene campo 'stock')
  filterByMinStock(minStock = 0) {
    console.log(`🔍 Filtrando por stock mínimo: ${minStock}`);
    this.query.where.stock = { [Op.gte]: minStock };
    return this;
  }

  // Aplica paginación a la consulta
  paginate(page = 1, limit = 10) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);

    console.log(`🔍 Paginando: página ${pageNum}, límite ${limitNum}`);
    
    this.query.limit = limitNum;
    this.query.offset = (pageNum - 1) * limitNum;

    return this;
  }

  // Añadir ordenación por defecto
  orderBy(field = 'createdAt', direction = 'DESC') {
    console.log(`🔍 Ordenando por: ${field} ${direction}`);
    
    // Validar que el campo existe en el modelo
    const validFields = ['id', 'name', 'price', 'stock', 'sku', 'createdAt', 'updatedAt'];
    if (validFields.includes(field)) {
      this.query.order = [[field, direction]];
    } else {
      console.log(`⚠️  Campo "${field}" no válido, usando orden por defecto (createdAt)`);
      this.query.order = [['createdAt', direction]];
    }
    
    return this;
  }

  build() {
    // Asegurar que siempre haya un orden
    if (!this.query.order) {
      this.query.order = [['createdAt', 'DESC']];
    }
    
    // Log de debugging detallado
    console.log('\n📋 ProductQueryBuilder - RESUMEN DE FILTROS:');
    console.log('WHERE (campos aplicados):', Object.keys(this.query.where).length > 0 ? this.query.where : 'Ninguno');
    console.log('INCLUDE (relaciones):', this.query.include.length > 0 ? 
      this.query.include.map(inc => `${inc.as} (${inc.model.name})`).join(', ') : 'Ninguna');
    console.log('PAGINACIÓN:', { 
      limit: this.query.limit, 
      offset: this.query.offset,
      página: Math.floor(this.query.offset / this.query.limit) + 1
    });
    console.log('ORDEN:', this.query.order[0].join(' '));
    
    // Eliminar relaciones duplicadas
    const uniqueIncludes = [];
    const seen = new Set();
    
    this.query.include.forEach(include => {
      const key = include.as || include.model.name;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueIncludes.push(include);
      }
    });
    
    this.query.include = uniqueIncludes;
    
    console.log('✅ Query construido exitosamente');
    
    return this.query;
  }
}

module.exports = ProductQueryBuilder;