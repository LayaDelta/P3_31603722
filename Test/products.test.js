// test/Products.test.js
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const productsRouter = require('../routes/products');
const productController = require('../controllers/productController');
const { verificarToken, generarToken } = require('../middlewares/auth');

// Mock de auth
jest.mock('../middlewares/auth', () => ({
  verificarToken: jest.fn((req, res, next) => {
    req.user = { userId: 1, email: 'test@example.com' };
    next();
  }),
  generarToken: jest.fn(() => 'nuevoTokenMock'),
}));

// Mock de controlador con implementaciones realistas
jest.mock('../controllers/productController', () => ({
  create: jest.fn((req, res) => {
    if (!req.body.name) return res.status(400).json({ status: 'fail', message: 'Error de validación' });
    res.setHeader('x-renewed-token', 'nuevoTokenMock');
    res.status(201).json({
      status: 'success',
      data: { id: 1, name: req.body.name, price: req.body.price, categoryId: req.body.categoryId, slug: 'pelicula', tags: req.body.tagIds }
    });
  }),
  getById: jest.fn((req, res) => {
    if (req.params.id !== '1') return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
    res.setHeader('x-renewed-token', 'nuevoTokenMock');
    res.status(200).json({ status: 'success', data: { id: 1, name: 'Película', price: 100 } });
  }),
  update: jest.fn((req, res) => {
    if (!req.body.name) return res.status(400).json({ status: 'fail', message: 'Error de validación' });
    res.setHeader('x-renewed-token', 'nuevoTokenMock');
    res.status(200).json({ status: 'success', data: { id: 1, name: req.body.name, price: req.body.price } });
  }),
  delete: jest.fn((req, res) => {
    if (req.params.id !== '1') return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
    res.setHeader('x-renewed-token', 'nuevoTokenMock');
    res.status(200).json({ status: 'success', message: 'Producto eliminado' });
  }),
  list: jest.fn((req, res) => {
    res.status(200).json({ status: 'success', data: { total: 1, page: 1, products: [{ id: 1, name: 'Película' }] } });
  }),
  getPublic: jest.fn((req, res) => {
    if (req.params.id !== '1') return res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
    res.status(200).json({ status: 'success', data: { id: 1, name: 'Película', slug: 'pelicula' } });
  }),
}));

// Configurar app
const app = express();
app.use(bodyParser.json());
app.use('/products', productsRouter);

describe('Products API', () => {

  afterEach(() => jest.clearAllMocks());

  // POST /products
  it('POST /products success', async () => {
    const res = await request(app)
      .post('/products')
      .send({ name: 'Película', price: 100, categoryId: 1, tagIds: [1,2] })
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
  });

  it('POST /products fails validation', async () => {
    const res = await request(app)
      .post('/products')
      .send({ name: '', price: 0 })
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: 'fail', message: 'Error de validación' });
  });

  // GET /products/:id
  it('GET /products/:id success', async () => {
    const res = await request(app).get('/products/1').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
  });

  it('GET /products/:id not found', async () => {
    const res = await request(app).get('/products/999').set('Authorization', 'Bearer token');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'fail', message: 'Producto no encontrado' });
  });

  // PUT /products/:id
  it('PUT /products/:id success', async () => {
    const res = await request(app)
      .put('/products/1')
      .send({ name: 'Película Modificada', price: 150 })
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
  });

  it('PUT /products/:id fails validation', async () => {
    const res = await request(app)
      .put('/products/1')
      .send({ name: '' })
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: 'fail', message: 'Error de validación' });
  });

  // DELETE /products/:id
  it('DELETE /products/:id success', async () => {
    const res = await request(app).delete('/products/1').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.headers['x-renewed-token']).toBe('nuevoTokenMock');
  });

  it('DELETE /products/:id not found', async () => {
    const res = await request(app).delete('/products/999').set('Authorization', 'Bearer token');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'fail', message: 'Producto no encontrado' });
  });

  // GET /products list
  it('GET /products list', async () => {
    const res = await request(app).get('/products').query({ page: 1, limit: 10 }).set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

  // GET /products/p/:id-:slug public
  it('GET /products/p/:id-:slug public success', async () => {
    const res = await request(app).get('/products/p/1-pelicula');
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('pelicula');
  });

  it('GET /products/p/:id-:slug public not found', async () => {
    const res = await request(app).get('/products/p/999-noexiste');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'fail', message: 'Producto no encontrado' });
  });

});
