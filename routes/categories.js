const express = require('express');
const router = express.Router();
const CategoryService = require('../services/categoryService');
const { verificarToken, generarToken } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Categorías
 *   description: Endpoints para gestionar categorías
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Electrónica"
 *         description:
 *           type: string
 *           example: "Productos electrónicos y gadgets"
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         headers:
 *           x-renewed-token:
 *             description: Token JWT renovado
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await CategoryService.findAll();
    const nuevoToken = generarToken({ userId: req.user.userId, email: req.user.email });
    res.setHeader('x-renewed-token', nuevoToken);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error al obtener las categorías' });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         headers:
 *           x-renewed-token:
 *             description: Token JWT renovado
 *             schema:
 *               type: string
 *       404:
 *         description: Categoría no encontrada
 */
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CategoryService.findById(id);
    const nuevoToken = generarToken({ userId: req.user.userId, email: req.user.email });
    res.setHeader('x-renewed-token', nuevoToken);

    if (result.status === 'fail') return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error al obtener la categoría' });
  }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Crear nueva categoría
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Categoría creada
 *         headers:
 *           x-renewed-token:
 *             description: Token JWT renovado
 *             schema:
 *               type: string
 *       400:
 *         description: Error de validación
 */
router.post('/', verificarToken, async (req, res) => {
  try {
    const result = await CategoryService.create(req.body);
    const nuevoToken = generarToken({ userId: req.user.userId, email: req.user.email });
    res.setHeader('x-renewed-token', nuevoToken);

    if (result.status === 'fail') return res.status(400).json(result);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error al crear la categoría' });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *         headers:
 *           x-renewed-token:
 *             description: Token JWT renovado
 *             schema:
 *               type: string
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Categoría no encontrada
 */
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CategoryService.update(id, req.body);
    const nuevoToken = generarToken({ userId: req.user.userId, email: req.user.email });
    res.setHeader('x-renewed-token', nuevoToken);

    if (result.status === 'fail') return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error al actualizar la categoría' });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Eliminar categoría
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoría eliminada
 *         headers:
 *           x-renewed-token:
 *             description: Token JWT renovado
 *             schema:
 *               type: string
 *       404:
 *         description: Categoría no encontrada
 */
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CategoryService.delete(id);
    const nuevoToken = generarToken({ userId: req.user.userId, email: req.user.email });
    res.setHeader('x-renewed-token', nuevoToken);

    if (result.status === 'fail') return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error al eliminar la categoría' });
  }
});

module.exports = router;
