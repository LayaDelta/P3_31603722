const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();

// Rutas principales
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

// Configuración de Swagger desde archivo externo
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

// Rutas base
app.use('/', indexRouter);
app.use('/auth', authRouter);    
app.use('/users', usersRouter); 

// Endpoint de información del autor
app.get('/about', (req, res) => {
  res.json({
    status: 'success',
    data: {
      nombreCompleto: 'Juan Laya',
      cedula: '31603722',
      seccion: 'Seccion 1',
    },
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
