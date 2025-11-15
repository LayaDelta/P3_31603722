const CategoryRepository = require('../repositories/categoryRepository');

class CategoryService {

  // Crear una nueva categoría
  static async create(data) {
    const { name } = data;

    // Evitar duplicados
    const exists = await CategoryRepository.findByName(name);
    if (exists) {
      return { status: 'fail', message: 'El nombre de la categoría ya existe' };
    }

    const category = await CategoryRepository.create(data);

    return {
      status: 'success',
      data: { category }
    };
  }

  // Obtener todas las categorías
  static async findAll() {
    const categories = await CategoryRepository.findAll();

    return {
      status: 'success',
      data: { categories }
    };
  }

  // Obtener categoría por ID
  static async findById(id) {
    const category = await CategoryRepository.findById(id);

    if (!category) {
      return { status: 'fail', message: 'Categoría no encontrada' };
    }

    return {
      status: 'success',
      data: { category }
    };
  }

  // Actualizar categoría
  static async update(id, data) {
    const category = await CategoryRepository.findById(id);

    if (!category) {
      return { status: 'fail', message: 'Categoría no encontrada' };
    }

    // Si cambia el nombre, validar que no esté repetido
    if (data.name && data.name !== category.name) {
      const exists = await CategoryRepository.findByName(data.name);
      if (exists) {
        return { status: 'fail', message: 'Ya existe una categoría con ese nombre' };
      }
    }

    await CategoryRepository.update(id, data);
    const updated = await CategoryRepository.findById(id);

    return {
      status: 'success',
      data: { category: updated }
    };
  }

  // Eliminar categoría
  static async delete(id) {
    const category = await CategoryRepository.findById(id);

    if (!category) {
      return { status: 'fail', message: 'Categoría no encontrada' };
    }

    await CategoryRepository.delete(id);

    return {
      status: 'success',
      message: 'Categoría eliminada exitosamente'
    };
  }
}

module.exports = CategoryService;
