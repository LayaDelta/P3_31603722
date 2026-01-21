const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verificarToken, generarToken } = require('../middlewares/auth');

//Correccion a realizar: Sistema  de flitrado por Categoria, Tags, paginacion y busqueda de productos debe aislar el producto siempre y cuando cumpla con los parametros pedidos en el filtro
/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Endpoints para gestión de productos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
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
 *     ProductInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - categoryId
 *       properties:
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
 *         tagIds:
 *           type: array
 *           items:
 *             type: integer
 *           example: [1, 2]
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear un producto (privado)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *           example:
 *             name: "Película"
 *             description: "Entretenimiento"
 *             price: 100
 *             categoryId: 1
 *             tagIds: [1, 2]
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', verificarToken, productController.create);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener un producto por ID (privado)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', verificarToken, productController.getById);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar un producto (privado)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *           example:
 *             name: "Película"
 *             description: "Entretenimiento"
 *             price: 100
 *             categoryId: 1
 *             tagIds: [1, 2]
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', verificarToken, productController.update);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar un producto (privado)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', verificarToken, productController.delete);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar productos con filtros (público)
 *     tags: [Productos]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Número de página
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Cantidad de resultados por página
 *       - name: category
 *         in: query
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Filtrar por categoría
 *       - name: tags
 *         in: query
 *         schema:
 *           type: string
 *           example: "1,2"
 *         description: Filtrar por tags (IDs separados por coma)
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *           example: "Película"
 *         description: Buscar por nombre o descripción
 *     responses:
 *       200:
 *         description: Listado de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', productController.list);

/**
 * @swagger
 * /products/p/{id}-{slug}:
 *   get:
 *     summary: Obtener un producto público por ID y slug (self-healing URL)
 *     tags: [Productos]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "pelicula"
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       301:
 *         description: Redirección a la URL correcta
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/p/:id-:slug', productController.getPublic);

module.exports = router;
