const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const cors = require('cors');

// Rutas principales previas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

// NUEVAS RUTAS para categorías y productos
const categoryRouter = require('./routes/categories');
const productRouter = require('./routes/products');
const publicProductRouter = require('./routes/publicProducts');

// Configuración de Swagger
const setupSwagger = require('./swagger.js');

// Crear la aplicación Express
const app = express();

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configurar Swagger
setupSwagger(app);

// Rutas base previas
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);

// NUEVAS RUTAS DEL MÓDULO DE PRODUCTOS
app.use('/categories', categoryRouter);
app.use('/products', productRouter);
app.use('/public/products', publicProductRouter);

// Endpoint de información
app.get('/about', (req, res) => {
  res.json({
    status: 'success',
    data: {
      nombreCompleto: 'Juan Laya',
      cedula: '31603722',
      seccion: 'Seccion 1',
    }
  });
});

// Endpoint de verificación rápida del servidor
app.get('/ping', (req, res) => res.status(200).end());

const { sequelize, User, Category, Product } = require('./models');

// Función de inicialización DIRECTAMENTE en app.js
async function initializeDatabase() {
  try {
    console.log('Inicializando base de datos...');
    
    // 1. Sincronizar tablas
    await sequelize.sync({ alter: false });
    console.log('Tablas sincronizadas');
    
    // 2. Crear usuario admin
    await createAdminUser();
    
    // 3. Crear datos de prueba solo si no hay productos
    const productsCount = await Product.count();
    if (productsCount === 0) {
      await createSampleData();
      console.log('Datos de prueba creados');
    } else {
      console.log(`Ya existen ${productsCount} productos, omitiendo datos de prueba`);
    }
    
    // 4. Mostrar resumen
    console.log('RESUMEN INICIAL:');
    const modelNames = ['User', 'Category', 'Product'];
    for (const modelName of modelNames) {
      const model = sequelize.models[modelName];
      if (model) {
        const count = await model.count();
        console.log(`${modelName.padEnd(15)}: ${count} registros`);
      }
    }
    
    console.log('Base de datos inicializada correctamente!');
    return true;
    
  } catch (error) {
    console.error('Error en inicialización:', error.message);
    return false;
  }
}

// Función para crear usuario admin
async function createAdminUser() {
  try {
    console.log('Verificando/creando usuario administrador...');
    
    const adminEmail = 'admin@test.com';
    const adminPassword = '123456';
    
    let adminUser = await User.findOne({ where: { email: adminEmail } });
    
    if (adminUser) {
      console.log(`Usuario admin ya existe (ID: ${adminUser.id})`);
      
      // Asegurar que sea admin
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        adminUser.active = true;
        await adminUser.save();
        console.log('Usuario actualizado a rol admin');
      }
      
    } else {
      adminUser = await User.create({
        nombreCompleto: 'Administrador del Sistema',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        active: true
      });
      
      console.log(`Usuario admin creado (ID: ${adminUser.id})`);
    }
    
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('¡Cambia esta contraseña en producción!');
    
    return adminUser;
    
  } catch (error) {
    console.error('Error creando usuario admin:', error.message);
    throw error;
  }
}

// Función para datos de prueba
async function createSampleData() {
  try {
    console.log('Creando datos de prueba...');
    
    // Crear categorías
    const categories = await Category.bulkCreate([
      { name: 'Electrónica', description: 'Productos electrónicos' },
      { name: 'Ropa', description: 'Ropa y accesorios' },
      { name: 'Hogar', description: 'Productos para el hogar' },
      { name: 'Deportes', description: 'Artículos deportivos' }
    ], { ignoreDuplicates: true });
    
    console.log(`${categories.length} categorías creadas`);
    
    // Crear productos
    const products = await Product.bulkCreate([
      {
        name: 'Smartphone Avanzado',
        description: 'Teléfono inteligente de última generación',
        price: 299.99,
        stock: 50,
        brand: 'TechBrand',
        categoryId: categories[0].id
      },
      {
        name: 'Camiseta Deportiva',
        description: 'Camiseta técnica para deporte',
        price: 24.99,
        stock: 100,
        brand: 'SportWear',
        categoryId: categories[1].id
      }
    ]);
    
    console.log(`${products.length} productos creados`);
    
    return true;
    
  } catch (error) {
    console.error('Error creando datos de prueba:', error.message);
    throw error;
  }
}

// Inicialización condicional
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('Conexión a SQLite establecida');
      
      // Solo inicializar en desarrollo
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        await initializeDatabase();
      }
      
      console.log('Aplicación lista para recibir peticiones');
    } catch (error) {
      console.error('Error de base de datos:', error.message);
    }
  })();
}

module.exports = app;