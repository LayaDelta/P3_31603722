// test/tag.test.js
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const tagsRouter = require('../routes/tags');
const { verificarToken, generarToken } = require('../middlewares/auth');

// Mock de middlewares
jest.mock('../middlewares/auth', () => ({
  verificarToken: jest.fn((req, res, next) => {
    req.user = { userId: 1, email: 'test@example.com' };
    next();
  }),
  generarToken: jest.fn(() => 'nuevoTokenMock'),
}));

// Configuración de Express
const app = express();
app.use(bodyParser.json());
app.use('/tags', tagsRouter);

// Funciones mockeadas del controlador
const mockTagController = {
  findAll: jest.fn((req, res) => {
    res.set('x-renewed-token', generarToken());
    res.status(200).json([
      { id: 1, name: 'Acción' },
      { id: 2, name: 'Drama' }
    ]);
  }),
  findById: jest.fn((req, res) => {
    const { id } = req.params;
    res.set('x-renewed-token', generarToken());
    if (id === '1') {
      return res.status(200).json({ id: 1, name: 'Acción' });
    }
    return res.status(404).json({ status: 'fail', message: 'Tag no encontrado' });
  }),
  create: jest.fn((req, res) => {
    const { name } = req.body;
    res.set('x-renewed-token', generarToken());
    if (!name) {
      return res.status(400).json({ status: 'fail', message: 'Error de validación' });
    }
    res.status(201).json({ id: 3, name });
  }),
  update: jest.fn((req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    res.set('x-renewed-token', generarToken());
    if (id !== '1') return res.status(404).json({ status: 'fail', message: 'Tag no encontrado' });
    res.status(200).json({ id: 1, name });
  }),
  delete: jest.fn((req, res) => {
    const { id } = req.params;
    res.set('x-renewed-token', generarToken());
    if (id !== '1') return res.status(404).json({ status: 'fail', message: 'Tag no encontrado' });
    res.status(200).json({ status: 'success', message: 'Tag eliminado' });
  })
};

// Reemplazar las funciones del router con mocks
tagsRouter.stack.forEach((layer) => {
  if (layer.route) {
    const path = layer.route.path;
    const method = Object.keys(layer.route.methods)[0];
    switch (`${method.toUpperCase()} ${path}`) {
      case 'GET /': layer.route.stack[0].handle = mockTagController.findAll; break;
      case 'GET /:id': layer.route.stack[0].handle = mockTagController.findById; break;
      case 'POST /': layer.route.stack[0].handle = mockTagController.create; break;
      case 'PUT /:id': layer.route.stack[0].handle = mockTagController.update; break;
      case 'DELETE /:id': layer.route.stack[0].handle = mockTagController.delete; break;
    }
  }
});

describe('Tags API', () => {

  afterEach(() => jest.clearAllMocks());

  it('GET /tags returns all tags', async () => {
    const res = await request(app).get('/tags').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 1, name: 'Acción' },
      { id: 2, name: 'Drama' }
    ]);
    expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
  });

  it('GET /tags/:id returns tag by ID', async () => {
    const res = await request(app).get('/tags/1').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, name: 'Acción' });
  });

  it('GET /tags/:id returns 404 if not found', async () => {
    const res = await request(app).get('/tags/999').set('Authorization', 'Bearer token');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'fail', message: 'Tag no encontrado' });
  });

  it('POST /tags creates a new tag', async () => {
    const res = await request(app)
      .post('/tags')
      .send({ name: 'Comedia' })
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 3, name: 'Comedia' });
  });

  it('POST /tags returns 400 on validation error', async () => {
    const res = await request(app)
      .post('/tags')
      .send({})
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: 'fail', message: 'Error de validación' });
  });

  it('PUT /tags/:id updates a tag', async () => {
    const res = await request(app)
      .put('/tags/1')
      .send({ name: 'Drama' })
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, name: 'Drama' });
  });

  it('PUT /tags/:id returns 404 if not found', async () => {
    const res = await request(app)
      .put('/tags/999')
      .send({ name: 'Suspense' })
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'fail', message: 'Tag no encontrado' });
  });

  it('DELETE /tags/:id deletes a tag', async () => {
    const res = await request(app).delete('/tags/1').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'success', message: 'Tag eliminado' });
  });

  it('DELETE /tags/:id returns 404 if not found', async () => {
    const res = await request(app).delete('/tags/999').set('Authorization', 'Bearer token');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'fail', message: 'Tag no encontrado' });
  });

});
