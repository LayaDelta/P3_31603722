const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generarToken } = require('../middlewares/auth');
const bcrypt = require('bcrypt');

// eliminar password antes de enviar
function ocultarPassword(user) {
  const { password, ...resto } = user.toJSON();
  return resto;
}

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints para registro y login de usuarios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthRegister:
 *       type: object
 *       required:
 *         - nombreCompleto
 *         - email
 *         - password
 *       properties:
 *         nombreCompleto:
 *           type: string
 *           example: "Juan Laya"
 *         email:
 *           type: string
 *           example: "juan@example.com"
 *         password:
 *           type: string
 *           example: "123456"
 *     AuthLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: "juan@example.com"
 *         password:
 *           type: string
 *           example: "123456"
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombreCompleto:
 *           type: string
 *           example: "Juan Laya"
 *         email:
 *           type: string
 *           example: "juan@example.com"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             usuario:
 *               $ref: '#/components/schemas/Usuario'
 *             token:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registro de nuevo usuario
 *     description: Crea un nuevo usuario en la base de datos, valida unicidad del correo y devuelve un token JWT.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegister'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Campos faltantes o correo ya registrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/register', async (req, res) => {
  try {
    const { nombreCompleto, email, password } = req.body;

    // Validación de campos obligatorios
    if (!nombreCompleto || !email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Todos los campos son obligatorios' });
    }

    // Verificar si ya existe usuario con ese email
    const existente = await User.findOne({ where: { email } });
    if (existente) {
      return res.status(400).json({ status: 'fail', message: 'Email ya registrado' });
    }

    // Crear nuevo usuario
    const nuevo = await User.create({ nombreCompleto, email, password });

    // Generar token JWT
    const token = generarToken({ userId: nuevo.id, email: nuevo.email });

    // Respuesta JSend
    res.status(201).json({
      status: 'success',
      data: {
        usuario: ocultarPassword(nuevo),
        token
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicio de sesión de usuario
 *     description: Verifica credenciales y devuelve un token JWT válido.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLogin'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Faltan campos obligatorios
 *       401:
 *         description: Contraseña incorrecta
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación de campos obligatorios
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Email y contraseña son obligatorios' });
    }

    // Buscar usuario por email
    const user = await User.scope(null).findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Usuario no encontrado' });
    }

    // Verificar contraseña
    const valido = await bcrypt.compare(password, user.password);
    if (!valido) {
      return res.status(401).json({ status: 'fail', message: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    const token = generarToken({ userId: user.id, email: user.email });

    // Respuesta JSend
    res.json({
      status: 'success',
      data: {
        usuario: ocultarPassword(user),
        token
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
});

module.exports = router;
