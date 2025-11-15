const ProductService = require('../services/productService');

class ProductController {

    /** Crear un nuevo producto */
    async create(req, res) {
        try {
            const { name, price, categoryId } = req.body;

            // Validación mínima: campos obligatorios
            if (!name || !price || !categoryId) {
                return res.status(400).json({
                    status: "fail",
                    message: "Los campos name, price y categoryId son obligatorios"
                });
            }

            // Llamar al servicio para crear
            const result = await ProductService.create(req.body);

            // Validación de respuesta del servicio
            if (result.status !== 'success') {
                return res.status(400).json(result);
            }

            return res.status(201).json(result);

        } catch (error) {
            console.error("🔥 ERROR AL CREAR PRODUCTO:", error);
            return res.status(500).json({
                status: "error",
                message: "Error al crear el producto"
            });
        }
    }

    /** Obtener producto por ID */
    async getById(req, res) {
        try {
            const { id } = req.params;

            // Consultar en la base de datos
            const result = await ProductService.findById(id);

            // Si no existe → 404
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

    /** Actualizar un producto */
    async update(req, res) {
        try {
            const { id } = req.params;

            const result = await ProductService.update(id, req.body);

            // Error de validación o actualización
            if (result.status !== 'success') {
                return res.status(400).json(result);
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

    /** Eliminar un producto */
    async delete(req, res) {
        try {
            const { id } = req.params;

            const result = await ProductService.delete(id);

            // Si no se encontró → 404
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

    /** Listado público con filtros de búsqueda */
    async list(req, res) {
        try {
            // Recibe filtros desde req.query
            const result = await ProductService.publicSearch(req.query);
            return res.json(result);

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: "error",
                message: "Error al obtener listado de productos"
            });
        }
    }

    /** Obtener producto público (SEO + Self-Healing URL) */
    async getPublic(req, res) {
        try {
            const { id, slug } = req.params;

            // Buscar producto y verificar si el slug correcto coincide
            const result = await ProductService.publicFindByIdAndSlug(id, slug);

            // Si el slug está mal → redirección permanente (301)
            if (result.redirect) {
                return res.redirect(301, result.correctUrl);
            }

            return res.json(result);

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: "error",
                message: "Error al obtener producto público"
            });
        }
    }

}

module.exports = new ProductController();
