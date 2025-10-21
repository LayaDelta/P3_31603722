var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config(); 

// Swagger para documentación de la API
var swaggerJsdoc = require('swagger-jsdoc');
var swaggerUi = require('swagger-ui-express');

// Rutas principales
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');

// Middleware para validar JWT
const { verificarToken } = require('./middlewares/auth');

// Crear la aplicación Express
var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API P3 - Express + Swagger',
      version: '1.0.0',
      description: 'Documentación de la API del Proyecto 3 - Juan Laya (31603722)',
    },
  },
  apis: ['./app.js', './routes/*.js'], // Se documenta usando comentarios JSDoc
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rutas base de la aplicación
app.use('/', indexRouter);
app.use('/auth', authRouter);    // Rutas públicas de autenticación
app.use('/users', usersRouter);  // Rutas protegidas, verifican token internamente

/**
 * @swagger
 * /about:
 *   get:
 *     summary: Muestra información del autor.
 *     description: Devuelve un JSON con nombre, cédula y sección.
 *     responses:
 *       200:
 *         description: Información obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     nombreCompleto:
 *                       type: string
 *                       example: "Juan Laya"
 *                     cedula:
 *                       type: string
 *                       example: "31603722"
 *                     seccion:
 *                       type: string
 *                       example: "Seccion 1"
 */
app.get('/about', (req, res) => {
  res.json({
    status: "success",
    data: {
      nombreCompleto: "Juan Laya",
      cedula: "31603722",
      seccion: "Seccion 1"
    }
  });
});

// verificación rápida del servidor
/**
 * @swagger
 * /ping:
 *   get:
 *     summary: Comprueba que el servidor está funcionando.
 *     description: Devuelve un estado 200 sin contenido.
 *     responses:
 *       200:
 *         description: Servidor disponible.
 */
app.get('/ping', (req, res) => {
  res.status(200).end();
});

// Conexión y sincronización con la base de datos
const { sequelize } = require('./models');

if (process.env.NODE_ENV !== 'test') {
  sequelize.sync({ alter: true })
    .then(() => console.log('Base de datos SQLite sincronizada'))
    .catch(err => console.error('Error al sincronizar la base de datos:', err));
}

// Exportar la app para usarla en otros módulos
module.exports = app;
