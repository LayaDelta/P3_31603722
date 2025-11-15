const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const categoriesRouter = require('../routes/categories');
const CategoryService = require('../services/categoryService');
const { verificarToken, generarToken } = require('../middlewares/auth');

jest.mock('../services/categoryService');
jest.mock('../middlewares/auth', () => ({
  verificarToken: jest.fn((req, res, next) => {
    req.user = { userId: 1, email: 'test@example.com' };
    next();
  }),
  generarToken: jest.fn(() => 'nuevoTokenMock'),
}));

const app = express();
app.use(bodyParser.json());
app.use('/categories', categoriesRouter);

describe('Categories API', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /categories', () => {
    it('should return all categories with renewed token', async () => {
      CategoryService.findAll.mockResolvedValue([
        { id: 1, name: 'Electrónica', description: 'Productos electrónicos' }
      ]);

      const res = await request(app).get('/categories').set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { id: 1, name: 'Electrónica', description: 'Productos electrónicos' }
      ]);
      expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
    });
  });

  describe('GET /categories/:id', () => {
    it('should return category if exists', async () => {
      CategoryService.findById.mockResolvedValue({
        status: 'success',
        data: { id: 1, name: 'Electrónica', description: 'Productos electrónicos' }
      });

      const res = await request(app).get('/categories/1').set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        data: { id: 1, name: 'Electrónica', description: 'Productos electrónicos' }
      });
      expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
    });

    it('should return 404 if category not found', async () => {
      CategoryService.findById.mockResolvedValue({ status: 'fail', message: 'No encontrada' });

      const res = await request(app).get('/categories/999').set('Authorization', 'Bearer token');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ status: 'fail', message: 'No encontrada' });
      expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
    });
  });

  describe('POST /categories', () => {
    it('should create a category', async () => {
      CategoryService.create.mockResolvedValue({
        status: 'success',
        data: { id: 2, name: 'Hogar', description: 'Productos para el hogar' }
      });

      const res = await request(app)
        .post('/categories')
        .send({ name: 'Hogar', description: 'Productos para el hogar' })
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        status: 'success',
        data: { id: 2, name: 'Hogar', description: 'Productos para el hogar' }
      });
      expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
    });

    it('should return 400 if creation fails', async () => {
      CategoryService.create.mockResolvedValue({ status: 'fail', message: 'Error de validación' });

      const res = await request(app)
        .post('/categories')
        .send({ name: '' })
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ status: 'fail', message: 'Error de validación' });
      expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
    });
  });

  describe('PUT /categories/:id', () => {
    it('should update category', async () => {
      CategoryService.update.mockResolvedValue({
        status: 'success',
        data: { id: 1, name: 'Electrónica Modificada', description: 'Descripción nueva' }
      });

      const res = await request(app)
        .put('/categories/1')
        .send({ name: 'Electrónica Modificada', description: 'Descripción nueva' })
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        data: { id: 1, name: 'Electrónica Modificada', description: 'Descripción nueva' }
      });
      expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
    });

    it('should return 400 if update fails', async () => {
      CategoryService.update.mockResolvedValue({ status: 'fail', message: 'Error de validación' });

      const res = await request(app)
        .put('/categories/1')
        .send({ name: '' })
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ status: 'fail', message: 'Error de validación' });
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete category', async () => {
      CategoryService.delete.mockResolvedValue({ status: 'success', message: 'Eliminada' });

      const res = await request(app).delete('/categories/1').set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'success', message: 'Eliminada' });
      expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
    });

    it('should return 404 if category not found', async () => {
      CategoryService.delete.mockResolvedValue({ status: 'fail', message: 'No encontrada' });

      const res = await request(app).delete('/categories/999').set('Authorization', 'Bearer token');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ status: 'fail', message: 'No encontrada' });
    });
  });

});
