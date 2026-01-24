// routes/products.js - SOLUCIÓN 2 IMPLEMENTADA
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verificarToken } = require('../middlewares/auth');

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
 *           example: "Smartphone Avanzado"
 *         description:
 *           type: string
 *           example: "Teléfono inteligente de última generación"
 *         price:
 *           type: number
 *           format: float
 *           example: 299.99
 *         stock:
 *           type: integer
 *           example: 50
 *         brand:
 *           type: string
 *           example: "TechBrand"
 *         categoryId:
 *           type: integer
 *           example: 1
 *         slug:
 *           type: string
 *           example: "smartphone-avanzado"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         category:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *         tags:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *     ProductInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - categoryId
 *       properties:
 *         name:
 *           type: string
 *           example: "Smartphone Avanzado"
 *         description:
 *           type: string
 *           example: "Teléfono inteligente de última generación"
 *         price:
 *           type: number
 *           format: float
 *           example: 299.99
 *         stock:
 *           type: integer
 *           example: 50
 *         brand:
 *           type: string
 *           example: "TechBrand"
 *         categoryId:
 *           type: integer
 *           example: 1
 *         tagIds:
 *           type: array
 *           items:
 *             type: integer
 *           example: [1, 3]
 *     ApiResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [success, error]
 *           example: "success"
 *         message:
 *           type: string
 *           example: "Operación exitosa"
 *         data:
 *           type: object
 *     ApiError:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "error"
 *         message:
 *           type: string
 *           example: "Error en la operación"
 */

// 🔐 ENDPOINTS PRIVADOS (requieren autenticación)

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear un nuevo producto (PRIVADO)
 *     description: Crea un nuevo producto en el sistema - REQUIERE autenticación con token Bearer
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
 *             name: "Laptop Gaming Pro"
 *             description: "Laptop de alto rendimiento para gaming"
 *             price: 1299.99
 *             stock: 25
 *             brand: "GamerTech"
 *             categoryId: 1
 *             tagIds: [1, 3]
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Error de validación o datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: No autorizado - Token inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', verificarToken, productController.create);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar producto existente (PRIVADO)
 *     description: Actualiza los datos de un producto existente - REQUIERE autenticación
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID del producto a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 */
router.put('/:id', verificarToken, productController.update);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar producto (PRIVADO)
 *     description: Elimina un producto del sistema - REQUIERE autenticación
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 */
router.delete('/:id', verificarToken, productController.delete);

// 🌐 ENDPOINTS PÚBLICOS (sin autenticación)

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar productos con filtros avanzados (PÚBLICO)
 *     description: Obtiene una lista paginada de productos con múltiples opciones de filtrado - NO requiere autenticación
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
 *         description: Cantidad de resultados por página
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Filtrar por categoría (ID)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *           example: "1,2,3"
 *         description: Filtrar por tags (IDs separados por coma)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "gaming"
 *         description: Buscar por nombre, descripción o marca
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *           example: "TechBrand"
 *         description: Filtrar por marca específica
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *           example: 100
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *           example: 1000
 *         description: Precio máximo
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, updatedAt]
 *           default: createdAt
 *         description: Campo para ordenar los resultados
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Dirección del orden (ASC = ascendente, DESC = descendente)
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 45
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       400:
 *         description: Parámetros de filtro inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', productController.list);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener producto por ID (PÚBLICO)
 *     description: Obtiene un producto específico por su ID - NO requiere autenticación
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', productController.getById);

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Búsqueda específica de productos (PÚBLICO)
 *     description: Búsqueda avanzada de productos por múltiples criterios - NO requiere autenticación
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Buscar producto por ID exacto
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *           example: "1"
 *         description: Filtrar por tag (ID o nombre)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           example: "1"
 *         description: Filtrar por categoría (ID o nombre)
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           example: "smartphone"
 *         description: Palabra clave para búsqueda en nombre, descripción, marca, categoría o tags
 *       - in: query
 *         name: exact
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Si es true, busca coincidencia exacta; si es false, busca coincidencia parcial
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *           example: "TechBrand"
 *         description: Filtrar por marca específica
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           example: 100
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           example: 1000
 *         description: Precio máximo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Resultados de búsqueda obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     criteria:
 *                       type: object
 *                       description: Criterios de búsqueda aplicados
 *                     count:
 *                       type: integer
 *                       example: 5
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       400:
 *         description: Parámetros de búsqueda inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/search', productController.search);

module.exports = router;