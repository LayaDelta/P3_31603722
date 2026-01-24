// scripts/debug-public-products.js
const { sequelize } = require('../models');

async function debugPublicProducts() {
  console.log('🔍 DEBUG DE PRODUCTOS PÚBLICOS\n');
  
  try {
    // 1. Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a BD establecida\n');
    
    // 2. Contar productos
    const [productCount] = await sequelize.query('SELECT COUNT(*) as count FROM products');
    console.log(`📊 Total productos en BD: ${productCount[0].count}\n`);
    
    if (productCount[0].count === 0) {
      console.log('⚠️  ¡NO HAY PRODUCTOS EN LA BASE DE DATOS!\n');
      console.log('💡 Solución: Crear productos de prueba...\n');
      
      // Crear categoría si no existe
      const [categoryExists] = await sequelize.query(
        'SELECT id FROM categories WHERE name = "Electrónica" LIMIT 1'
      );
      
      let categoryId = categoryExists[0]?.id;
      
      if (!categoryId) {
        console.log('🔄 Creando categoría "Electrónica"...');
        await sequelize.query(`
          INSERT INTO categories (name, slug, createdAt, updatedAt)
          VALUES ('Electrónica', 'electronica', datetime('now'), datetime('now'))
        `);
        
        const [newCat] = await sequelize.query('SELECT id FROM categories WHERE name = "Electrónica"');
        categoryId = newCat[0].id;
        console.log(`✅ Categoría creada con ID: ${categoryId}\n`);
      }
      
      // Crear productos de prueba
      console.log('🔄 Creando 3 productos de prueba...');
      await sequelize.query(`
        INSERT INTO products (name, description, price, stock, sku, slug, categoryId, createdAt, updatedAt)
        VALUES 
          ('iPhone 14 Pro', 'Smartphone Apple 256GB', 999.99, 50, 'IPH14PRO-001', 'iphone-14-pro', ${categoryId}, datetime('now'), datetime('now')),
          ('Samsung Galaxy S23', 'Smartphone Samsung 128GB', 799.99, 75, 'SGS23-001', 'samsung-galaxy-s23', ${categoryId}, datetime('now'), datetime('now')),
          ('Google Pixel 7', 'Smartphone Google 256GB', 599.99, 30, 'GP7-001', 'google-pixel-7', ${categoryId}, datetime('now'), datetime('now'))
      `);
      
      console.log('✅ Productos de prueba creados\n');
    }
    
    // 3. Verificar estructura de productos
    console.log('🔍 Verificando estructura de productos...');
    const [products] = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.sku,
        p.slug,
        p.categoryId,
        p.createdAt,
        c.name as categoryName
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      LIMIT 5
    `);
    
    console.log(`📦 ${products.length} productos encontrados:`);
    products.forEach((p, i) => {
      console.log(`\n   ${i+1}. "${p.name}"`);
      console.log(`      ID: ${p.id}`);
      console.log(`      Precio: $${p.price}`);
      console.log(`      Stock: ${p.stock}`);
      console.log(`      SKU: ${p.sku}`);
      console.log(`      Slug: ${p.slug}`);
      console.log(`      Categoría ID: ${p.categoryId}`);
      console.log(`      Categoría: ${p.categoryName || 'Ninguna'}`);
    });
    
    // 4. Verificar si los productos tienen categoryId válido
    console.log('\n🔍 Verificando categoryId...');
    const [invalidCategory] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE categoryId IS NULL OR categoryId NOT IN (SELECT id FROM categories)
    `);
    
    console.log(`⚠️  Productos con categoryId inválido: ${invalidCategory[0].count}`);
    
    if (invalidCategory[0].count > 0) {
      console.log('\n🔄 Arreglando categoryId inválido...');
      
      // Obtener primera categoría disponible
      const [firstCategory] = await sequelize.query('SELECT id FROM categories LIMIT 1');
      
      if (firstCategory.length > 0) {
        const catId = firstCategory[0].id;
        await sequelize.query(`
          UPDATE products 
          SET categoryId = ${catId} 
          WHERE categoryId IS NULL OR categoryId NOT IN (SELECT id FROM categories)
        `);
        console.log(`✅ Productos actualizados con categoryId = ${catId}`);
      }
    }
    
    // 5. Probar consulta de Sequelize directa
    console.log('\n🔍 Probando consulta Sequelize directa...');
    const { Product, Category, Tag } = require('../models');
    
    const testResult = await Product.findAndCountAll({
      limit: 5,
      attributes: ['id', 'name', 'price', 'stock', 'sku', 'slug'],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] },
          attributes: ['id', 'name', 'color']
        }
      ],
      order: [['id', 'ASC']]
    });
    
    console.log(`✅ Sequelize.findAndCountAll:`);
    console.log(`   - count: ${testResult.count}`);
    console.log(`   - rows: ${testResult.rows.length}`);
    
    if (testResult.rows.length > 0) {
      console.log(`\n📋 Primer producto desde Sequelize:`);
      const firstProduct = testResult.rows[0];
      console.log(`   ID: ${firstProduct.id}`);
      console.log(`   Nombre: "${firstProduct.name}"`);
      console.log(`   ¿Tiene categoría?: ${firstProduct.category ? 'Sí' : 'No'}`);
      console.log(`   ¿Tiene tags?: ${firstProduct.tags ? firstProduct.tags.length : 0}`);
    }
    
    console.log('\n🎉 Debug completado!');
    
  } catch (error) {
    console.error('❌ Error en debug:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar
debugPublicProducts();