const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { verificarToken, generarToken } = require('../middlewares/auth');

// Helper: eliminar password antes de enviar
function ocultarPassword(user) {
  const { password, ...resto } = user.toJSON();
  return resto;
}

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Endpoints protegidos para gestión de usuarios
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombreCompleto:
 *           type: string
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           example: "juan@example.com"
 *     UsuarioInput:
 *       type: object
 *       required:
 *         - nombreCompleto
 *         - email
 *         - password
 *       properties:
 *         nombreCompleto:
 *           type: string
 *           example: "Ana García"
 *         email:
 *           type: string
 *           example: "ana@example.com"
 *         password:
 *           type: string
 *           example: "123456"
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         headers:
 *           x-renewed-token:
 *             description: Token JWT renovado
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/', verificarToken, async (req, res) => {
  const users = await User.findAll({ order: [['id', 'ASC']] });
  
  // Creamos un array con IDs consecutivos (solo para la respuesta)
  const sanitized = users.map((user, index) => {
    const { password, ...resto } = user.toJSON();
    return { id: index + 1, ...resto };
  });

  const nuevoToken = generarToken({ userId: req.user.userId, email: req.user.email });
  res.setHeader('x-renewed-token', nuevoToken);

  res.json({ status: 'success', data: sanitized });
});
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         headers:
 *           x-renewed-token:
 *             description: Token JWT renovado
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 */
router.post('/', verificarToken, async (req, res) => {
  const { nombreCompleto, email, password } = req.body;
  const nuevo = await User.create({ nombreCompleto, email, password });

  const nuevoToken = generarToken({ userId: req.user.userId, email: req.user.email });
  res.setHeader('x-renewed-token', nuevoToken);

  res.status(201).json({ status: 'success', data: ocultarPassword(nuevo) });
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', verificarToken, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ status: 'fail', message: 'Usuario no encontrado' });

  const nuevoToken = generarToken({ userId: req.user.userId, email: req.user.email });
  res.setHeader('x-renewed-token', nuevoToken);

  res.json({ status: 'success', data: ocultarPassword(user) });
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar datos de un usuario
 *     tags: [Usuarios]
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
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id', verificarToken, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ status: 'fail', message: 'Usuario no encontrado' });

  const { nombreCompleto, email, password } = req.body;
  if (nombreCompleto) user.nombreCompleto = nombreCompleto;
  if (email) user.email = email;
  if (password) user.password = password;
  await user.save();

  const nuevoToken = generarToken({ userId: req.user.userId, email: req.user.email });
  res.setHeader('x-renewed-token', nuevoToken);

  res.json({ status: 'success', data: ocultarPassword(user) });
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Usuarios]
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
 *         description: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id', verificarToken, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ status: 'fail', message: 'Usuario no encontrado' });

  await user.destroy();

  const nuevoToken = generarToken({ userId: req.user.userId, email: req.user.email });
  res.setHeader('x-renewed-token', nuevoToken);

  res.json({ status: 'success', data: null });
});

module.exports = router;
