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

  try {
    const response = await axios.post(`http://localhost:${process.env.PORT || 3000}/auth/login`, {
      email: 'admin@test.com',    
      password: '123456',          
    });

    if (response.data && response.data.data && response.data.data.token) {
      adminToken = response.data.data.token;
      console.log('Token admin obtenido para Swagger');
    } else {
      console.error('No se encontró token en la respuesta de login');
    }
  } catch (err) {
    console.error('Error al generar token para Swagger:', err.message);
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
            schema: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            value: `${adminToken}`,
          },
        },
      },
    })
  );
}

module.exports = setupSwagger;
