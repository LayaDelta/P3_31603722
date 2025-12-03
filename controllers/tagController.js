const TagRepository = require('../repositories/tagRepository');

class TagController {

    // Crear un nuevo tag POST /tags
     
    async create(req, res) {
        try {
            const { name } = req.body;

            // Validación mínima
            if (!name) {
                return res.status(400).json({
                    status: "fail",
                    message: "El campo 'name' es obligatorio"
                });
            }

            // Verificar si el nombre ya existe
            const exists = await TagRepository.findByName(name);
            if (exists) {
                return res.status(400).json({
                    status: "fail",
                    message: "Ya existe un tag con ese nombre"
                });
            }

            // Crear tag
            const tag = await TagRepository.create({ name });

            return res.status(201).json({
                status: "success",
                data: { tag }
            });

        } catch (err) {
            console.error("Error al crear tag:", err);
            return res.status(500).json({
                status: "error",
                message: "Error al crear el tag"
            });
        }
    }

    // Obtener todos los tags GET /tags
     
    async findAll(req, res) {
        try {
            const tags = await TagRepository.findAll();

            return res.json({
                status: "success",
                data: { tags }
            });

        } catch (err) {
            console.error("Error al obtener tags:", err);
            return res.status(500).json({
                status: "error",
                message: "Error al obtener los tags"
            });
        }
    }

    //Obtener tag por ID  GET /tags/:id
    async findById(req, res) {
        try {
            const { id } = req.params;

            const tag = await TagRepository.findById(id);

            // Si no existe → 404
            if (!tag) {
                return res.status(404).json({
                    status: "fail",
                    message: "Tag no encontrado"
                });
            }

            return res.json({
                status: "success",
                data: { tag }
            });

        } catch (err) {
            console.error("Error al obtener tag:", err);
            return res.status(500).json({
                status: "error",
                message: "Error al obtener el tag"
            });
        }
    }

    // Actualizar un tag PUT /tags/:id
   
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            // Buscar tag
            const tag = await TagRepository.findById(id);

            if (!tag) {
                return res.status(404).json({
                    status: "fail",
                    message: "Tag no encontrado"
                });
            }

            // Si se desea actualizar el nombre
            if (name) {
                const exists = await TagRepository.findByName(name);

                // Validar que no exista otro tag con el mismo nombre
                if (exists && exists.id !== Number(id)) {
                    return res.status(400).json({
                        status: "fail",
                        message: "Ya existe otro tag con ese nombre"
                    });
                }

                tag.name = name;
            }

            // Guardar cambios
            await TagRepository.update(id, tag);

            return res.json({
                status: "success",
                data: { tag }
            });

        } catch (err) {
            console.error("Error al actualizar tag:", err);
            return res.status(500).json({
                status: "error",
                message: "Error al actualizar el tag"
            });
        }
    }

    //Eliminar un tag  DELETE /tags/:id
    async delete(req, res) {
        try {
            const { id } = req.params;

            const tag = await TagRepository.findById(id);

            // Si no existe → 404
            if (!tag) {
                return res.status(404).json({
                    status: "fail",
                    message: "Tag no encontrado"
                });
            }

            await TagRepository.delete(id);

            return res.json({
                status: "success",
                message: "Tag eliminado correctamente"
            });

        } catch (err) {
            console.error("Error al eliminar tag:", err);
            return res.status(500).json({
                status: "error",
                message: "Error al eliminar el tag"
            });
        }
    }
}

module.exports = new TagController();
