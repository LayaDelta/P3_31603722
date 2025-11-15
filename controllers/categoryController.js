const CategoryService = require('../services/categoryService');
const { generarToken } = require('../middlewares/auth');

class CategoryController {

    // Renueva el token y lo envía en la cabecera de la respuesta
    renovarToken(req, res) {
        const nuevo = generarToken({
            userId: req.user.userId,
            email: req.user.email,
        });

        // El nuevo token se envía en la cabecera personalizada
        res.setHeader("x-renewed-token", nuevo);
    }

    // Crear una nueva categoría
    async create(req, res) {
        try {
            const result = await CategoryService.create(req.body);

            // Si el servicio indica un fallo del cliente
            if (result.status === 'fail') {
                return res.status(400).json(result);
            }

            this.renovarToken(req, res);
            return res.status(201).json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: "error",
                message: "Error al crear la categoría"
            });
        }
    }

    // Obtener todas las categorías
    async findAll(req, res) {
        try {
            const result = await CategoryService.findAll();

            this.renovarToken(req, res);
            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: "error",
                message: "Error al obtener las categorías"
            });
        }
    }

    // Obtener una categoría específica por ID
    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await CategoryService.findById(id);

            // Si no existe, se envía estado 404
            if (result.status === 'fail') {
                return res.status(404).json(result);
            }

            this.renovarToken(req, res);
            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: "error",
                message: "Error al obtener la categoría"
            });
        }
    }

    // Actualizar una categoría por ID
    async update(req, res) {
        try {
            const { id } = req.params;
            const result = await CategoryService.update(id, req.body);

            // Si el servicio indica error del cliente (datos inválidos)
            if (result.status === 'fail') {
                return res.status(400).json(result);
            }

            this.renovarToken(req, res);
            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: "error",
                message: "Error al actualizar la categoría"
            });
        }
    }

    // Eliminar una categoría por ID
    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await CategoryService.delete(id);

            // Si no se encontró la categoría
            if (result.status === 'fail') {
                return res.status(404).json(result);
            }

            this.renovarToken(req, res);
            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: "error",
                message: "Error al eliminar la categoría"
            });
        }
    }
}

module.exports = new CategoryController();
