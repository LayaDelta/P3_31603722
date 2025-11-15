const { Category, Tag } = require('../models');
const ProductRepository = require('../repositories/productRepository');
const slugify = require('slugify');
const ProductQueryBuilder = require('../builders/productQueryBuilder');

class ProductService {

  // Genera un slug único basado en el nombre del producto
  static async generateUniqueSlug(name, productId = null) {
    if (!name) return null;

    let baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await ProductRepository.slugExists(slug, productId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Crear un nuevo producto
  static async create(data) {
    if (!data || Object.keys(data).length === 0) {
      return { status: 'fail', message: 'No se enviaron datos para crear el producto' };
    }

    const { name, categoryId, tagIds = [] } = data;

    if (!name || !categoryId) {
      return { status: 'fail', message: 'Los campos name y categoryId son obligatorios' };
    }

    // Validar categoría
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return { status: 'fail', message: 'La categoría no existe' };
    }

    // Validar tags
    let tags = [];
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      tags = await Tag.findAll({ where: { id: tagIds } });
      if (tags.length !== tagIds.length) {
        return { status: 'fail', message: 'Uno o más tags no existen' };
      }
    }

    // Generar slug único
    const slug = await this.generateUniqueSlug(name);

    // Crear producto con relaciones
    const product = await ProductRepository.createWithRelations({
      name: data.name,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      slug,
      tagIds: data.tagIds || []
    });

    return { status: 'success', data: { product } };
  }

  // Obtener producto por ID
  static async findById(id) {
    if (!id) return { status: 'fail', message: 'ID no proporcionado' };

    const product = await ProductRepository.findByIdWithRelations(id);
    if (!product) {
      return { status: 'fail', message: 'Producto no encontrado' };
    }

    return { status: 'success', data: { product } };
  }

  // Actualizar producto
  static async update(id, data) {
    if (!id) return { status: 'fail', message: 'ID no proporcionado' };
    if (!data || Object.keys(data).length === 0) {
      return { status: 'fail', message: 'No se enviaron datos para actualizar' };
    }

    const product = await ProductRepository.findById(id);
    if (!product) {
      return { status: 'fail', message: 'Producto no encontrado' };
    }

    // Actualizar slug si cambia el nombre
    if (data.name && data.name !== product.name) {
      data.slug = await this.generateUniqueSlug(data.name, id);
    }

    // Validar categoría si viene
    if (data.categoryId) {
      const category = await Category.findByPk(data.categoryId);
      if (!category) {
        return { status: 'fail', message: 'La categoría no existe' };
      }
      product.categoryId = data.categoryId;
    }

    // Actualizar datos del producto
    await ProductRepository.update(id, data);

    // Actualizar tags si vienen
    if (data.tagIds) {
      await ProductRepository.assignTags(id, data.tagIds);
    }

    const updated = await ProductRepository.findByIdWithRelations(id);

    return { status: 'success', data: { product: updated } };
  }

  // Eliminar producto
  static async delete(id) {
    if (!id) return { status: 'fail', message: 'ID no proporcionado' };

    const product = await ProductRepository.findById(id);
    if (!product) {
      return { status: 'fail', message: 'Producto no encontrado' };
    }

    await ProductRepository.delete(id);

    return { status: 'success', message: 'Producto eliminado' };
  }

  // Búsqueda pública con filtros
  static async publicSearch(queryParams) {
    const builder = new ProductQueryBuilder(queryParams || {});
    const query = builder.build();

    // Incluir relaciones necesarias
    query.include = [
      { model: Category, as: 'category' },
      { model: Tag, as: 'tags', through: { attributes: [] } }
    ];

    const { rows, count } = await ProductRepository.queryAdvanced(query);

    return {
      status: 'success',
      data: {
        total: count,
        page: queryParams?.page || 1,
        limit: queryParams?.limit || 10,
        products: rows
      }
    };
  }

  // Self-Healing URL: obtiene producto por ID y slug
  static async publicFindByIdAndSlug(id, slug) {
    if (!id || !slug) return { status: 'fail', message: 'ID o slug no proporcionado' };

    const product = await ProductRepository.findByIdWithRelations(id);
    if (!product) {
      return { status: 'fail', message: 'Producto no encontrado' };
    }

    if (product.slug !== slug) {
      return {
        redirect: true,
        correctUrl: `/p/${product.id}-${product.slug}`
      };
    }

    return { status: 'success', data: { product } };
  }
}

module.exports = ProductService;
