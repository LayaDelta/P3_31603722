const BaseRepository = require('./baseRepository');
const { Tag } = require('../models');

class TagRepository extends BaseRepository {
  constructor() {
    super(Tag);
  }

  /**
   * Busca un tag por su nombre (case insensitive)
   */
  async findByName(name) {
    return await Tag.findOne({
      where: { name: name.toLowerCase() }
    });
  }

  /**
   * Crea un tag solo si no existe uno con el mismo nombre
   */
  async createIfNotExists(name) {
    const existing = await this.findByName(name);
    if (existing) return existing;

    return await Tag.create({ name: name.toLowerCase() });
  }

  /**
   * Obtiene múltiples tags por lista de IDs
   */
  async findByIds(ids) {
    return await Tag.findAll({
      where: { id: ids }
    });
  }
}

module.exports = new TagRepository();
