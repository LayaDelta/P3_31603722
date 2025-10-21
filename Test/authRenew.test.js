// tests/authRenew.test.js
const request = require('supertest');
const app = require('../app');
const { sequelize, User } = require('../models');
const { Op } = require('sequelize');

jest.setTimeout(10000);

const TEST_EMAIL_PREFIX = 'test_';

describe('Pruebas de autenticación y renovación de token', () => {
  let token;
  let testEmail;

  // Registro de usuario nuevo
  test('Debe registrar un usuario correctamente', async () => {
    testEmail = `${TEST_EMAIL_PREFIX}juan_${Date.now()}@test.com`;

    const res = await request(app)
      .post('/auth/register')
      .send({
        nombreCompleto: 'Juan Laya',
        email: testEmail,
        password: '123456'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.usuario.email).toBe(testEmail);
  });

  // Intento de registrar con email duplicado
  test('Debe fallar si el email ya está registrado', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        nombreCompleto: 'Juan Laya',
        email: testEmail,
        password: '123456'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('fail');
  });

  // Login con credenciales correctas
  test('Debe iniciar sesión correctamente y devolver token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testEmail,
        password: '123456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeDefined();

    token = res.body.data.token;
  });

  // Login con contraseña incorrecta
  test('Debe fallar si las credenciales son incorrectas', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'wrongpass'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('fail');
  });

  // Intento de acceso a ruta protegida sin token
  test('Debe denegar acceso a /users sin token', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Token no proporcionado/);
  });

  // Acceso a ruta protegida con token válido y verificación de renovación
  test('Debe permitir acceso y renovar el token JWT', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.headers['x-renewed-token']).toBeDefined();

    token = res.headers['x-renewed-token'];
  });

  // Verificar que el token renovado funciona correctamente
  test('El token renovado debe permitir acceso nuevamente', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
  });

  // Simulación de token expirado
  test('Debe rechazar token expirado', async () => {
    // Espera 6 segundos (JWT_EXPIRES_IN=5s)
    await new Promise(r => setTimeout(r, 6000));

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/expirado/);
  });

  // Cleanup: eliminar solo los usuarios de prueba
  afterAll(async () => {
    await User.destroy({
      where: {
        email: {
          [Op.like]: `${TEST_EMAIL_PREFIX}%`
        }
      }
    });

    await sequelize.close();
  });
});
