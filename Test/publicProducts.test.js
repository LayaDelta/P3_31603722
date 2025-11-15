// test/publicProduct.test.js
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const productsRouter = require('../routes/products'); // tu router real
const productController = require('../controllers/productController');

// Mock del controlador
jest.mock('../controllers/productController');

const app = express();
app.use(bodyParser.json());
app.use('/products', productsRouter);

describe('Public Product API', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products/p/:id-:slug', () => {

    it('should return public product by id and slug', async () => {
      productController.getPublic.mockImplementation(async (req, res) => {
        res.status(200).json({
          status: 'success',
          data: { id: 1, name: 'Película', slug: 'pelicula' }
        });
      });

      const res = await request(app)
        .get('/products/p/1-pelicula'); // Ruta completa con /products

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'success',
        data: { id: 1, name: 'Película', slug: 'pelicula' }
      });
    });

    it('should return 404 if public product not found', async () => {
      productController.getPublic.mockImplementation(async (req, res) => {
        res.status(404).json({ status: 'fail', message: 'Producto no encontrado' });
      });

      const res = await request(app)
        .get('/products/p/999-noexiste');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'fail',
        message: 'Producto no encontrado'
      });
    });

  });

});
