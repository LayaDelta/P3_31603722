const express = require('express');
const router = express.Router();
const publicProductController = require('../controllers/publicProductController');

/**
 * @swagger
 * tags:
 *   name: Productos Públicos
 *   description: Endpoints públicos de productos (sin login)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Película"
 *         description:
 *           type: string
 *           example: "Entretenimiento"
 *         price:
 *           type: number
 *           example: 100
 *         categoryId:
 *           type: integer
 *           example: 1
 *         slug:
 *           type: string
 *           example: "pelicula"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /public/products:
 *   get:
 *     summary: Listado público de productos
 *     tags: [Productos Públicos]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de resultados por página
 *       - name: category
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Filtrar por categoría
 *       - name: tags
 *         in: query
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Filtrar por tags (IDs separados por coma)
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *           default: "Película"
 *         description: Buscar por nombre o descripción
 *     responses:
 *       200:
 *         description: Listado de productos
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
 *                     total:
 *                       type: integer
 *                       example: 1
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PublicProduct'
 */

/**
 * @swagger
 * /public/products/{id}-{slug}:
 *   get:
 *     summary: Detalle público de un producto (self-healing URL)
 *     tags: [Productos Públicos]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           default: "pelicula"
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/PublicProduct'
 *       301:
 *         description: Redirección a la URL correcta
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */

// Rutas
router.get('/', publicProductController.list);
router.get('/:id-:slug', publicProductController.getPublic);

module.exports = router;
