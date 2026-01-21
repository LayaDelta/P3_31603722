const { sequelize, verifyDatabase } = require('./models');

async function fixExistingDatabase() {
  console.log('🛠️  Corrigiendo base de datos existente...');
  
  try {
    // 1. Eliminar tabla ProductTags vieja si existe
    await sequelize.query(`DROP TABLE IF EXISTS ProductTags;`);
    console.log('✅ Tabla ProductTags vieja eliminada');
    
    // 2. Sincronizar todos los modelos
    await sequelize.sync({ alter: true });
    console.log('✅ Todos los modelos sincronizados');
    
    // 3. Verificar estructura
    await verifyDatabase();
    
    // 4. Ver datos actuales
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name;
    `);
    
    console.log('\n📊 Tablas existentes después de la corrección:');
    tables.forEach(table => console.log(`  - ${table.name}`));
    
    console.log('\n🎉 Base de datos corregida exitosamente!');
    console.log('\n📝 Recuerda:');
    console.log('1. Los productos existentes pueden haber perdido sus tags');
    console.log('2. Deberás reasignar manualmente los tags a los productos');
    console.log('3. Reinicia tu aplicación: npm run dev');
    
  } catch (error) {
    console.error('❌ Error corrigiendo base de datos:', error);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixExistingDatabase();
}

module.exports = fixExistingDatabase;