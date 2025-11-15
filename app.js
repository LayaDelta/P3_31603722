const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();

// Rutas principales previas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

// NUEVAS RUTAS para categorías, productos y tags
const categoryRouter = require('./routes/categories');
const productRouter = require('./routes/products');
const publicProductRouter = require('./routes/publicProducts');
const tagRouter = require('./routes/tags');

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

// Configurar Swagger
setupSwagger(app);

// Rutas base previas
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);

// NUEVAS RUTAS DEL MÓDULO DE PRODUCTOS
app.use('/categories', categoryRouter);        // CRUD categorías
app.use('/tags', tagRouter);                   // CRUD tags
app.use('/products', productRouter);           // CRUD productos (privado)
app.use('/public/products', publicProductRouter); // Productos 

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

// Conexión y sincronización con la base de datos
const { sequelize } = require('./models');
if (process.env.NODE_ENV !== 'test') {
  sequelize
    .sync({ alter: true })
    .then(() => console.log('Base de datos SQLite sincronizada'))
    .catch((err) => console.error('Error al sincronizar la base de datos:', err));
}

// Exportar app
module.exports = app;
