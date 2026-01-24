const ProductService = require('../services/productService');

class ProductController {
  
  /** Crear producto (privado) */
  async create(req, res) {
    try {
      // Validación básica
      const { name, price, categoryId } = req.body;
      if (!name || !price || !categoryId) {
        return res.status(400).json({
          status: "error",
          message: "Nombre, precio y categoría son requeridos"
        });
      }
      
      const result = await ProductService.create(req.body);
      
      if (result.status === 'success') {
        return res.status(201).json(result);
      }
      
      // Manejar errores específicos
      const statusCode = result.message.includes('no existe') ? 404 : 400;
      return res.status(statusCode).json(result);
      
    } catch (error) {
      console.error("ERROR AL CREAR PRODUCTO:", error);
      return res.status(500).json({
        status: "error",
        message: "Error interno al crear el producto",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /** Obtener producto por ID (privado) */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await ProductService.findById(id);

      if (result.status !== 'success') {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Error al obtener el producto"
      });
    }
  }

  /** Obtener producto por slug (público) */
  async getBySlug(req, res) {
    try {
      const { slug } = req.params;
      const result = await ProductService.findBySlug(slug);

      if (result.status !== 'success') {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Error al obtener el producto"
      });
    }
  }

  /** Actualizar producto (privado) */
  async update(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          status: "error",
          message: "No se enviaron datos para actualizar"
        });
      }
      
      const result = await ProductService.update(id, req.body);

      if (result.status !== 'success') {
        const statusCode = result.message.includes('no existe') ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Error al actualizar el producto"
      });
    }
  }

  /** Eliminar producto (privado) */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await ProductService.delete(id);

      if (result.status !== 'success') {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Error al eliminar el producto"
      });
    }
  }

  /** Listado público con filtros */
  async list(req, res) {
    try {
      const result = await ProductService.publicSearch(req.query);
      
      if (result.status !== 'success') {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Error en listado público:", error);
      return res.status(500).json({
        status: "error",
        message: "Error al obtener listado de productos"
      });
    }
  }

  /** Búsqueda específica */
  async search(req, res) {
    try {
      const { id, tag, category, keyword, exact, brand, minPrice, maxPrice, limit, sector } = req.query;
      
      const result = await ProductService.searchByCriteria({
        id,
        tag,
        category,
        keyword,
        exactMatch: exact === 'true',
        brand,
        minPrice,
        maxPrice,
        limit,
        sector,
        tagIds: tag ? tag.split(',').map(id => parseInt(id.trim())) : undefined
      });

      return res.json(result);
    } catch (error) {
      console.error("Error en búsqueda específica:", error);
      return res.status(500).json({
        status: "error",
        message: "Error en la búsqueda"
      });
    }
  }

  /** Productos relacionados */
  async related(req, res) {
    try {
      const { id } = req.params;
      const { limit = 4 } = req.query;
      
      const result = await ProductService.getRelatedProducts(id, parseInt(limit));
      
      if (result.status !== 'success') {
        return res.status(404).json(result);
      }
      
      return res.json(result);
    } catch (error) {
      console.error("Error obteniendo productos relacionados:", error);
      return res.status(500).json({
        status: "error",
        message: "Error al obtener productos relacionados"
      });
    }
  }

  /** Detectar duplicados (admin) */
  async detectDuplicates(req, res) {
    try {
      const result = await ProductService.detectDatabaseDuplicates();
      return res.json(result);
    } catch (error) {
      console.error("Error detectando duplicados:", error);
      return res.status(500).json({
        status: "error",
        message: "Error al detectar duplicados"
      });
    }
  }
}

module.exports = new ProductController();