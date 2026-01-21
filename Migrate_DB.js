// scripts/seed-with-existing-products.js
const { sequelize, Category, Tag, Product, ProductTag } = require('./models');

async function seedWithExistingProducts() {
  console.log('🌱 Sembrando datos (sin usuarios)...\n');
  
  const transaction = await sequelize.transaction();
  
  try {
    // 1. VERIFICAR ESTADO ACTUAL
    console.log('1. Verificando estado actual de la base de datos...');
    
    const [tables] = await sequelize.query(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
      { transaction }
    );
    
    console.log('Tablas existentes:', tables.map(t => t.name).join(', '));
    
    // Verificar si ProductTags tiene la estructura correcta
    const [productTagsInfo] = await sequelize.query(
      `PRAGMA table_info(ProductTags)`,
      { transaction }
    );
    
    if (productTagsInfo.length > 0) {
      console.log('✅ Tabla ProductTags existe');
      console.log('Estructura:', productTagsInfo.map(col => col.name).join(', '));
    } else {
      console.log('⚠️  Tabla ProductTags no existe, creando...');
      await createProductTagsTable(transaction);
    }
    
    // 2. VERIFICAR/CREAR CATEGORÍAS
    console.log('\n2. Verificando/Creando categorías...');
    
    const categoryNames = ['Electrónica', 'Ropa', 'Hogar', 'Deportes'];
    const categories = {};
    
    for (const name of categoryNames) {
      let [category] = await Category.findOrCreate({
        where: { name },
        defaults: { 
          description: `${name} - categoría por defecto` 
        },
        transaction
      });
      categories[name] = category;
      console.log(`   ${category.isNewRecord ? '➕' : '✅'} ${name}: ID ${category.id}`);
    }
    
    // 3. VERIFICAR/CREAR TAGS
    console.log('\n3. Verificando/Creando tags...');
    
    const tagNames = ['Nuevo', 'Oferta', 'Popular', 'Limitado', 'Recomendado'];
    const tags = {};
    
    for (const name of tagNames) {
      let [tag] = await Tag.findOrCreate({
        where: { name },
        defaults: {},
        transaction
      });
      tags[name] = tag;
      console.log(`   ${tag.isNewRecord ? '➕' : '✅'} ${name}: ID ${tag.id}`);
    }
    
    // 4. VERIFICAR PRODUCTOS EXISTENTES
    console.log('\n4. Verificando productos existentes...');
    
    const existingProducts = await Product.findAll({ 
      order: [['id', 'ASC']],
      transaction 
    });
    
    console.log(`   📊 Total productos existentes: ${existingProducts.length}`);
    
    if (existingProducts.length === 0) {
      console.log('   ⚠️  No hay productos existentes, creando algunos...');
      await createSampleProducts(categories, tags, transaction);
    } else {
      // Mostrar productos existentes
      existingProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (ID: ${product.id}, Categoría ID: ${product.categoryId || 'N/A'})`);
      });
      
      // Asignar categorías a productos que no la tengan
      const productsWithoutCategory = existingProducts.filter(p => !p.categoryId);
      if (productsWithoutCategory.length > 0) {
        console.log(`\n   ⚠️  ${productsWithoutCategory.length} productos sin categoría, asignando...`);
        
        for (const product of productsWithoutCategory) {
          // Asignar categoría por defecto (Electrónica)
          product.categoryId = categories['Electrónica'].id;
          await product.save({ transaction });
          console.log(`      ➡️  ${product.name} ahora tiene categoría ID: ${product.categoryId}`);
        }
      }
    }
    
    // 5. ASIGNAR TAGS A PRODUCTOS EXISTENTES
    console.log('\n5. Asignando tags a productos existentes...');
    
    const allProducts = existingProducts.length > 0 
      ? existingProducts 
      : await Product.findAll({ transaction });
    
    // Primero, limpiar relaciones existentes si es necesario
    const [existingRelations] = await sequelize.query(
      'SELECT COUNT(*) as count FROM ProductTags',
      { transaction }
    );
    
    if (existingRelations[0].count > 0) {
      console.log(`   ⚠️  Ya existen ${existingRelations[0].count} relaciones Product-Tag`);
      // Si hay relaciones existentes, podemos mantenerlas
      console.log('   Manteniendo relaciones existentes...');
    }
    
    // Asignar tags de forma inteligente
    const tagAssignments = {
      0: ['Nuevo', 'Popular', 'Recomendado'],     // Para primer producto
      1: ['Oferta', 'Popular'],                   // Para segundo producto
      2: ['Oferta', 'Limitado'],                  // Para tercer producto
      'default': ['Popular']                      // Para los demás
    };
    
    for (let i = 0; i < allProducts.length; i++) {
      const product = allProducts[i];
      const productTags = tagAssignments[i] || tagAssignments['default'];
      
      // Obtener IDs de tags
      const tagIds = productTags.map(tagName => tags[tagName].id);
      
      // Asignar usando método seguro (evita duplicados)
      await assignTagsToProduct(product.id, tagIds, transaction);
      
      console.log(`   ✅ ${product.name}: ${productTags.join(', ')}`);
    }
    
    // 6. COMMIT Y VERIFICACIÓN FINAL
    await transaction.commit();
    console.log('\n✅ Transacción completada exitosamente!');
    
    // 7. REPORTE FINAL (sin usuarios)
    console.log('\n📊 REPORTE FINAL (sin usuarios):');
    
    const [finalStats] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM categories) as categorias,
        (SELECT COUNT(*) FROM tags) as tags,
        (SELECT COUNT(*) FROM products) as productos,
        (SELECT COUNT(*) FROM ProductTags) as relaciones_product_tag
    `);
    
    const stats = finalStats[0];
    console.log(`   📂 Categorías: ${stats.categorias}`);
    console.log(`   🏷️  Tags: ${stats.tags}`);
    console.log(`   📦 Productos: ${stats.productos}`);
    console.log(`   🔗 Relaciones Product-Tag: ${stats.relaciones_product_tag}`);
    
    // Mostrar algunos productos con sus relaciones
    console.log('\n📋 EJEMPLOS DE PRODUCTOS CON RELACIONES:');
    
    const sampleProducts = await Product.findAll({
      limit: 3,
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags' }
      ]
    });
    
    sampleProducts.forEach((product, index) => {
      console.log(`\n   ${index + 1}. ${product.name}`);
      console.log(`      📍 Categoría: ${product.category?.name || 'Sin categoría'}`);
      console.log(`      🏷️  Tags: ${product.tags?.map(t => t.name).join(', ') || 'Sin tags'}`);
      console.log(`      💰 Precio: $${product.price}`);
      console.log(`      🔗 Slug: ${product.slug}`);
    });
    
    console.log('\n🎉 ¡Seed completado exitosamente!');
    console.log('\n💡 NOTA: Este seeder NO crea usuarios.');
    console.log('   Para crear usuarios, usa el endpoint de registro (/auth/register)');
    console.log('   o ejecuta un seeder específico para usuarios.');
    
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Error durante el seed:', error.message);
    
    // Error específico para UNIQUE constraint
    if (error.message.includes('UNIQUE constraint')) {
      console.log('\n💡 SOLUCIÓN:');
      console.log('1. Elimina relaciones duplicadas:');
      console.log('   DELETE FROM ProductTags WHERE productId IN (SELECT productId FROM ProductTags GROUP BY productId, tagId HAVING COUNT(*) > 1);');
      console.log('2. Crea índice único:');
      console.log('   CREATE UNIQUE INDEX IF NOT EXISTS product_tag_unique ON ProductTags(productId, tagId);');
      console.log('3. Vuelve a ejecutar este script.');
    }
    
  } finally {
    await sequelize.close();
  }
}

// FUNCIONES AUXILIARES
async function createProductTagsTable(transaction) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ProductTags (
      productId INTEGER NOT NULL,
      tagId INTEGER NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (productId, tagId),
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
    )
  `, { transaction });
  
  // Crear índice único para prevenir duplicados
  await sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS product_tag_unique 
    ON ProductTags(productId, tagId)
  `, { transaction });
}

async function createSampleProducts(categories, tags, transaction) {
  const sampleProducts = [
    {
      name: 'Smartphone Avanzado',
      description: 'Teléfono inteligente de última generación',
      price: 299.99,
      stock: 50,
      brand: 'TechBrand',
      categoryId: categories['Electrónica'].id,
      slug: 'smartphone-avanzado'
    },
    {
      name: 'Camiseta Deportiva Pro',
      description: 'Camiseta técnica para alto rendimiento',
      price: 34.99,
      stock: 100,
      brand: 'SportWear',
      categoryId: categories['Ropa'].id,
      slug: 'camiseta-deportiva-pro'
    },
    {
      name: 'Sofá Seccional Moderno',
      description: 'Sofá modular para espacios contemporáneos',
      price: 799.99,
      stock: 15,
      brand: 'HomeComfort',
      categoryId: categories['Hogar'].id,
      slug: 'sofa-seccional-moderno'
    },
    {
      name: 'Balón de Fútbol Profesional',
      description: 'Balón oficial para competiciones',
      price: 49.99,
      stock: 30,
      brand: 'SportPro',
      categoryId: categories['Deportes'].id,
      slug: 'balon-futbol-profesional'
    }
  ];
  
  for (const productData of sampleProducts) {
    await Product.create(productData, { transaction });
  }
}

async function assignTagsToProduct(productId, tagIds, transaction) {
  // Usar INSERT OR IGNORE para evitar errores de duplicados
  for (const tagId of tagIds) {
    try {
      await sequelize.query(`
        INSERT OR IGNORE INTO ProductTags (productId, tagId) 
        VALUES (?, ?)
      `, {
        replacements: [productId, tagId],
        transaction
      });
    } catch (error) {
      // Ignorar errores de duplicados (ya existe la relación)
      if (!error.message.includes('UNIQUE constraint')) {
        throw error;
      }
    }
  }
}

// Script de limpieza de relaciones duplicadas (si es necesario)
async function cleanDuplicateRelations() {
  console.log('🧹 Limpiando relaciones duplicadas...');
  
  await sequelize.query(`
    DELETE FROM ProductTags 
    WHERE rowid NOT IN (
      SELECT MIN(rowid) 
      FROM ProductTags 
      GROUP BY productId, tagId
    )
  `);
  
  console.log('✅ Relaciones duplicadas eliminadas');
}

// Ejecutar
if (require.main === module) {
  // Primero limpiar duplicados si es necesario
  cleanDuplicateRelations()
    .then(() => seedWithExistingProducts())
    .catch(console.error);
}

module.exports = {
  seedWithExistingProducts,
  cleanDuplicateRelations
};