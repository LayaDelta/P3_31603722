const TagRepository = require('../repositories/tagRepository');

class TagService {

  // Crear un nuevo tag
  static async create(data) {
    const { name } = data;

    // Validar duplicado
    const exists = await TagRepository.findByName(name);
    if (exists) {
      return { status: 'fail', message: 'El nombre del tag ya existe' };
    }

    const tag = await TagRepository.create(data);

    return {
      status: 'success',
      data: { tag }
    };
  }

  // Obtener todos los tags
  static async findAll() {
    const tags = await TagRepository.findAll();

    return {
      status: 'success',
      data: { tags }
    };
  }

  // Obtener tag por ID
  static async findById(id) {
    const tag = await TagRepository.findById(id);

    if (!tag) {
      return { status: 'fail', message: 'Tag no encontrado' };
    }

    return {
      status: 'success',
      data: { tag }
    };
  }

  // Actualizar un tag
  static async update(id, data) {
    const tag = await TagRepository.findById(id);

    if (!tag) {
      return { status: 'fail', message: 'Tag no encontrado' };
    }

    // Validar que el nuevo nombre no exista ya
    if (data.name && data.name !== tag.name) {
      const exists = await TagRepository.findByName(data.name);
      if (exists) {
        return { status: 'fail', message: 'Ya existe un tag con ese nombre' };
      }
    }

    await TagRepository.update(id, data);
    const updated = await TagRepository.findById(id);

    return {
      status: 'success',
      data: { tag: updated }
    };
  }

  // Eliminar un tag
  static async delete(id) {
    const tag = await TagRepository.findById(id);

    if (!tag) {
      return { status: 'fail', message: 'Tag no encontrado' };
    }

    await TagRepository.delete(id);

    return {
      status: 'success',
      message: 'Tag eliminado exitosamente'
    };
  }
}

module.exports = TagService;
