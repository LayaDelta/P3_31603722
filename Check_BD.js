// fix-backup-tables.js
const { sequelize } = require('./models');

async function fixBackupTables() {
  console.log('🔧 Eliminando tablas de respaldo problemáticas...');
  
  try {
    // Listar todas las tablas
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);
    
    console.log('📋 Tablas encontradas:');
    tables.forEach(t => console.log(`   - ${t.name}`));
    
    // Eliminar TODAS las tablas de respaldo
    const backupTables = tables.filter(t => t.name.includes('_backup'));
    
    if (backupTables.length > 0) {
      console.log('\n🗑️  Eliminando tablas de respaldo:');
      for (const table of backupTables) {
        await sequelize.query(`DROP TABLE IF EXISTS ${table.name}`);
        console.log(`   ✅ ${table.name} eliminada`);
      }
    } else {
      console.log('\n✅ No hay tablas de respaldo');
    }
    
    // Eliminar también tablas temporales de Sequelize
    await sequelize.query(`DROP TABLE IF EXISTS categories_backup`);
    await sequelize.query(`DROP TABLE IF EXISTS _products_backup`);
    await sequelize.query(`DROP TABLE IF EXISTS _tags_backup`);
    await sequelize.query(`DROP TABLE IF EXISTS _users_backup`);
    
    console.log('\n✅ Limpieza completada!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixBackupTables();