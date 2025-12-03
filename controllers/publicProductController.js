const ProductRepository = require('../repositories/productRepository');
const ProductQueryBuilder = require('../builders/productQueryBuilder');

class PublicProductController {

  //Listado público con filtros, paginación y relaciones
  async list(req, res) {
    try {
      // Extraer filtros desde la query
      const {
        page,
        limit,
        category,
        tags,
        price_min,
        price_max,
        search,
        brand,
        model
      } = req.query;

      // Convertir tags en array numérico si existen
      const tagArray = tags ? tags.split(',').map(Number) : null;

      // Construir el query dinámico usando el builder
      const builder = new ProductQueryBuilder()
        .filterByCategory(category)
        .filterByTags(tagArray)
        .filterByPrice(price_min, price_max)
        .search(search)
        .filterByBrand(brand)
        .filterByModel(model)
        .paginate(page, limit);

      // Obtener la consulta final
      const query = builder.build();

      // Asegurar que las relaciones category y tags siempre estén presentes
      if (!query.include.some(i => i.as === 'category')) {
        query.include.push({
          model: require('../models').Category,
          as: 'category'
        });
      }

      if (!query.include.some(i => i.as === 'tags')) {
        query.include.push({
          model: require('../models').Tag,
          as: 'tags',
          through: { attributes: [] } // evitar datos extras de la tabla pivote
        });
      }

      // Ejecutar consulta en repositorio
      const result = await ProductRepository.queryAdvanced(query);

      return res.json({
        status: 'success',
        data: {
          total: result.count,                  // total de productos
          page: Number(page) || 1,              // página actual
          limit: Number(limit) || 10,           // límite por página
          products: result.rows                 // productos encontrados
        }
      });

    } catch (error) {
      console.error("Error en listado público:", error);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener la lista de productos'
      });
    }
  }

  // Detalle público con Self-Healing URL
  async getPublic(req, res) {
    try {
      const { id, slug } = req.params;

      // Buscar producto con sus relaciones (categoría, tags, etc.)
      const product = await ProductRepository.findByIdWithRelations(id);

      // Si no existe → 404
      if (!product) {
        return res.status(404).json({
          status: 'fail',
          message: 'Producto no encontrado'
        });
      }

      // Si el slug no coincide → redirección SEO (301)
      if (slug !== product.slug) {
        return res.redirect(301, `/public/products/${product.id}-${product.slug}`);
      }

      // Respuesta correcta con datos
      return res.json({
        status: 'success',
        data: { product }
      });

    } catch (error) {
      console.error("Error en detalle público:", error);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener el producto'
      });
    }
  }
}

module.exports = new PublicProductController();
