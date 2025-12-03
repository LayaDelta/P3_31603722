const request = require('supertest');
const app = require('../app');
const { sequelize, User } = require('../models');
const { generarToken } = require('../middlewares/auth');

jest.setTimeout(30000);

let token;
let baseUser;

beforeAll(async () => {
  await sequelize.sync({ alter: true });

  // Usuario base para autenticación
  baseUser = await User.findOne({ where: { email: 'admin@test.com' } });
  if (!baseUser) {
    baseUser = await User.create({
      nombreCompleto: 'Admin Test',
      email: 'admin@test.com',
      password: '123456',
    });
  }

  token = generarToken({ userId: baseUser.id, email: baseUser.email });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Rutas protegidas de usuarios', () => {

  test('Denegar acceso si no se envía token', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Token no proporcionado/);
  });

  test('GET /users retorna lista de usuarios y renueva token', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    token = res.headers['x-renewed-token'];
  });

  test('POST /users crea y elimina un usuario de prueba', async () => {
    // Crear usuario de prueba
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombreCompleto: 'Usuario Prueba',
        email: 'usuario.prueba@test.com',
        password: '123456',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');

    const testUserId = res.body.data.id;

    // Borrar usuario inmediatamente después del test
    await User.destroy({ where: { id: testUserId } });
  });

  test('GET /users/:id retorna el usuario base', async () => {
    const res = await request(app)
      .get(`/users/${baseUser.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(baseUser.id);
  });

  test('PUT /users/:id actualiza el usuario base', async () => {
    const res = await request(app)
      .put(`/users/${baseUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombreCompleto: 'Admin Actualizado' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.nombreCompleto).toBe('Admin Actualizado');
  });

  test('DELETE /users/:id inexistente retorna 404', async () => {
    const res = await request(app)
      .delete(`/users/999999`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('fail');
  });
});
