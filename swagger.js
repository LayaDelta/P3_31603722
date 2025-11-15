const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const axios = require('axios');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API P3 - Express + Swagger',
      version: '1.0.0',
      description: 'Programación 3 - Juan Laya (31603722)',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, 'routes/*.js')],
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

async function setupSwagger(app) {
  let adminToken = '';

  if (process.env.NODE_ENV === 'test') {
    console.log('Modo Test: Omite generacion de token');
  } else {
    try {
      const port = process.env.PORT || 3000;
      const loginUrl = `http://localhost:${port}/auth/login`;

      const response = await axios.post(loginUrl, {
        email: 'admin@test.com',
        password: '123456',
      });

      adminToken = response?.data?.data?.token || '';

      if (adminToken) {
        console.log('✅ Token admin obtenido para Swagger');
      } else {
        console.warn('⚠️ No se encontró token en la respuesta de login');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.code ||
        err.message ||
        'Error desconocido';
      console.warn('⚠️ Swagger se cargará sin token:', msg);
    }
  }

  // Configurar Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpecs, {
      swaggerOptions: {
        persistAuthorization: true,
        authAction: {
          bearerAuth: {
            name: 'bearerAuth',
            schema: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
            value: adminToken ? `${adminToken}` : '',
          },
        },
      },
    })
  );
}

module.exports = setupSwagger;
