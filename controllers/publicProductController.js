// controllers/publicProductController.js - VERSIÓN CORREGIDA
const { Product, Category, Tag, sequelize } = require('../models');
const { Op } = require('sequelize');

class PublicProductController {
  async list(req, res) {
    console.log('\n🔍 ===== PublicProductController.list =====');
    console.log('📋 Query params recibidos:', req.query);
    
    try {
      const {
        page = 1,
        limit = 10,
        category,
        tags,
        price_min,
        price_max,
        search,
        sku
      } = req.query;

      console.log('🔍 Parámetros procesados:', { page, limit, category });

      // CONSTRUIR QUERY MANUALMENTE - ELIMINANDO EL BUILDER
      const where = {};
      const include = [];
      
      // 1. Filtro por categoría
      if (category) {
        const categoryId = parseInt(category);
        if (!isNaN(categoryId)) {
          where.categoryId = categoryId;  // Filtrar directamente por categoryId
          console.log(`✅ Filtrando por categoryId: ${categoryId}`);
        }
      }
      
      // 2. Siempre incluir relación con categoría (pero no filtrar aquí)
      include.push({
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
        required: false  // LEFT JOIN, no INNER JOIN
      });
      
      // 3. Incluir tags
      include.push({
        model: Tag,
        as: 'tags',
        through: { attributes: [] },
        attributes: ['id', 'name', 'color'],
        required: false
      });
      
      // 4. Filtro por precio
      if (price_min || price_max) {
        where.price = {};
        if (price_min) where.price[Op.gte] = parseFloat(price_min);
        if (price_max) where.price[Op.lte] = parseFloat(price_max);
      }
      
      // 5. Búsqueda por texto
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // 6. Filtro por SKU
      if (sku) {
        where.sku = { [Op.like]: `%${sku}%` };
      }
      
      // 7. Stock mínimo
      where.stock = { [Op.gte]: 0 };
      
      // Paginación
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, parseInt(limit) || 10);
      const offset = (pageNum - 1) * limitNum;
      
      // Construir query final
      const query = {
        where,
        include,
        limit: limitNum,
        offset: offset,
        order: [['createdAt', 'DESC']],
        distinct: true  // IMPORTANTE para relaciones many-to-many
      };
      
      console.log('🔍 Query final construida manualmente:');
      console.log('- WHERE:', JSON.stringify(where, null, 2));
      console.log('- INCLUDE:', include.map(i => i.as).join(', '));
      console.log('- PAGINACIÓN:', { limit: limitNum, offset, page: pageNum });
      
      // EJECUTAR CON findAndCountAll (NO con findAll)
      console.log('🔍 Ejecutando Product.findAndCountAll...');
      const result = await Product.findAndCountAll(query);
      
      console.log(`📊 RESULTADO: ${result.count} productos encontrados`);
      console.log(`📊 Productos devueltos: ${result.rows.length}`);
      
      // DEBUG: Verificar qué se encontró
      if (result.rows.length > 0) {
        console.log('🔍 Primer producto encontrado:');
        const p = result.rows[0];
        console.log(`   ID: ${p.id}, Nombre: "${p.name}"`);
        console.log(`   CategoryId: ${p.categoryId}`);
        console.log(`   Categoría: ${p.category ? p.category.name : 'null'}`);
        console.log(`   Tags: ${p.tags ? p.tags.length : 0}`);
      }
      
      // Formatear respuesta
      const formattedProducts = result.rows.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        brand: product.brand || '',
        images: product.images || [],
        sku: product.sku || '',
        slug: product.slug || '',
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug || ''
        } : null,
        tags: product.tags ? product.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color || '#000000'
        })) : []
      }));
      
      // Calcular paginación
      const totalPages = Math.ceil(result.count / limitNum);
      
      const response = {
        success: true,
        products: formattedProducts,
        pagination: {
          total: result.count,
          page: pageNum,
          limit: limitNum,
          totalPages: totalPages
        },
        filtersApplied: {
          category: !!category,
          tags: false, // Por ahora
          priceRange: !!(price_min || price_max),
          search: !!search,
          sku: !!sku
        }
      };
      
      console.log(`✅ Enviando ${formattedProducts.length} productos`);
      return res.json(response);
      
    } catch (error) {
      console.error("❌ Error en PublicProductController.list:", error.message);
      console.error("❌ Stack:", error.stack);
      
      return res.status(500).json({
        success: false,
        message: 'Error interno al obtener productos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  async getPublic(req, res) {
    try {
      const { id, slug } = req.params;

      console.log(`🔍 PublicProductController.getPublic: ID=${id}, Slug=${slug}`);

      // Buscar producto con relaciones
      const product = await ProductRepository.findByIdWithRelations(id);

      if (!product) {
        console.log(`❌ Producto ID ${id} no encontrado`);
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      console.log(`✅ Producto encontrado: "${product.name}" (ID: ${product.id})`);

      // Redirección SEO si el slug no coincide
      if (slug && slug !== product.slug) {
        console.log(`🔀 Redirigiendo a slug correcto: ${product.id}-${product.slug}`);
        return res.redirect(301, `/public/products/${product.id}-${product.slug}`);
      }

      // Formatear respuesta
      const formattedProduct = {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        brand: product.brand || '',
        images: product.images || [],
        sku: product.sku || '',
        slug: product.slug || '',
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug || ''
        } : null,
        tags: product.tags ? product.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color || '#000000'
        })) : []
      };

      console.log(`✅ Enviando producto ID ${product.id} al frontend`);
      
      return res.json({
        success: true,
        product: formattedProduct
      });

    } catch (error) {
      console.error("❌ Error en getPublic:", error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el producto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new PublicProductController();