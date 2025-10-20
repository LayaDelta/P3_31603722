// ================================
// 📦 Importaciones principales
// ================================
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Swagger
var swaggerJsdoc = require('swagger-jsdoc');
var swaggerUi = require('swagger-ui-express');

// Rutas base
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// ================================
// 🚀 Inicialización de la app
// ================================
var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ================================
// 📘 Configuración de Swagger
// ================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API P3 - Express + Swagger',
      version: '1.0.0',
      description: 'Documentación de la API del Proyecto 3 - Juan Laya (31603722)',
    },
  },
  apis: ['./app.js'], // Documentación incluida mediante comentarios JSDoc
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ================================
// 🌐 Rutas base
// ================================
app.use('/', indexRouter);
app.use('/users', usersRouter);

// ================================
// 📍 ENDPOINTS PERSONALIZADOS
// ================================

/**
 * @swagger
 * /about:
 *   get:
 *     summary: Información del autor del proyecto.
 *     description: Retorna un objeto JSON en formato JSend con datos del autor.
 *     responses:
 *       200:
 *         description: Información del autor obtenida correctamente.
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

/**
 * @swagger
 * /ping:
 *   get:
 *     summary: Verifica si el servidor está activo.
 *     description: Devuelve un código de estado 200 OK sin cuerpo.
 *     responses:
 *       200:
 *         description: Servidor disponible (sin contenido).
 */
app.get('/ping', (req, res) => {
  res.status(200).end();
});

// ================================
// 📦 Exportar la aplicación
// ================================
module.exports = app;
