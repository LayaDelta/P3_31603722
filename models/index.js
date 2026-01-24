// models/index.js - VERSIÓN CORREGIDA
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Configuración de Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false,
});

// Objeto para almacenar los modelos
const models = {};

// Cargar TODOS los modelos PRIMERO
console.log('📦 Cargando modelos...');
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'));

// Cargar cada modelo
modelFiles.forEach(file => {
  try {
    const modelFunction = require(path.join(__dirname, file));
    
    // Solo procesar archivos que exportan funciones (modelos)
    if (typeof modelFunction === 'function') {
      const model = modelFunction(sequelize);
      
      // Verificar que sea un modelo válido
      if (model && model.name) {
        models[model.name] = model;
        console.log(`   ✅ ${model.name} cargado desde ${file}`);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Error cargando ${file}:`, error.message);
  }
});

// IMPORTANTE: Esperar a que TODOS los modelos estén cargados ANTES de establecer relaciones
console.log(`\n📊 ${Object.keys(models).length} modelos cargados:`, Object.keys(models));

// Solo establecer relaciones si tenemos modelos
if (Object.keys(models).length > 0) {
  try {
    // Verificar si el archivo associations.js existe
    const associationsPath = path.join(__dirname, 'associations.js');
    
    if (fs.existsSync(associationsPath)) {
      console.log('\n🔗 Estableciendo relaciones entre modelos...');
      const setupAssociations = require(associationsPath);
      
      if (typeof setupAssociations === 'function') {
        setupAssociations(sequelize);
        console.log('✅ Relaciones establecidas correctamente');
      } else {
        console.warn('⚠️  associations.js no exporta una función');
      }
    } else {
      console.log('ℹ️  No se encontró archivo associations.js');
    }
  } catch (error) {
    console.error('❌ Error estableciendo relaciones:', error.message);
  }
} else {
  console.error('❌ No se pudieron cargar modelos para establecer relaciones');
}

// Exportar sequelize y modelos
module.exports = {
  sequelize,
  ...models,
  
  // Helper para verificar estado
  getModelStatus: function() {
    return {
      modelsLoaded: Object.keys(models),
      totalModels: Object.keys(models).length,
      associationsEstablished: Object.keys(sequelize.models).length > 0
    };
  }
};