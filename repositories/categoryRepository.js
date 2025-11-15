const BaseRepository = require('./baseRepository');
const { Category } = require('../models');

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  // Buscar categoría por nombre (case insensitive)
  async findByName(name) {
    return await Category.findOne({
      where: {
        name: name.trim(),
      },
    });
  }

  // Verifica si existe una categoría por ID, retorna true o false
  async existsById(id) {
    const count = await Category.count({ where: { id } });
    return count > 0;
  }
}

module.exports = new CategoryRepository();
