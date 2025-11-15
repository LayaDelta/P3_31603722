const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { verificarToken } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: Endpoints para gestión de etiquetas/tags
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Acción"
 *     TagInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Acción"
 */

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Listar todos los tags (privado)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tags
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tag'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', verificarToken, tagController.findAll);

/**
 * @swagger
 * /tags/{id}:
 *   get:
 *     summary: Obtener un tag por ID (privado)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       404:
 *         description: Tag no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', verificarToken, tagController.findById);

/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Crear un tag (privado)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagInput'
 *           example:
 *             name: "Acción"
 *     responses:
 *       201:
 *         description: Tag creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', verificarToken, tagController.create);

/**
 * @swagger
 * /tags/{id}:
 *   put:
 *     summary: Actualizar un tag (privado)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagInput'
 *           example:
 *             name: "Drama"
 *     responses:
 *       200:
 *         description: Tag actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Tag no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', verificarToken, tagController.update);

/**
 * @swagger
 * /tags/{id}:
 *   delete:
 *     summary: Eliminar un tag (privado)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag eliminado exitosamente
 *       404:
 *         description: Tag no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', verificarToken, tagController.delete);

module.exports = router;
