class BaseRepository {
  /**
   * Recibe el modelo de Sequelize que manejará este repositorio.
   */
  constructor(model) {
    if (!model) {
      throw new Error("BaseRepository requiere un modelo válido.");
    }
    this.model = model;
  }

  // CRUD básico

  // Obtener todos los registros
  async findAll(options = {}) {
    return await this.model.findAll(options);
  }

  // Buscar por ID
  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  // Crear un registro
  async create(data) {
    return await this.model.create(data);
  }

  // Actualizar un registro por ID
  async update(id, data) {
    const instance = await this.model.findByPk(id);
    if (!instance) return null;

    return await instance.update(data);
  }

  // Eliminar un registro por ID
  async delete(id) {
    const instance = await this.model.findByPk(id);
    if (!instance) return null;

    await instance.destroy();
    return instance;
  }

  // Consultas personalizadas: para repositorios que necesiten filtros avanzados
  async findWithQuery(queryOptions = {}) {
    return await this.model.findAll(queryOptions);
  }
}

module.exports = BaseRepository;
