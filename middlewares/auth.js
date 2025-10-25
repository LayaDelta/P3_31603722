const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error('FATAL: La variable SECRET_KEY no está definida en el archivo .env');
}

// Genera un token JWT
function generarToken(payload) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

//  Middleware para validar y renovar token
async function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        status: 'fail',
        message: 'Token no proporcionado. Usa el encabezado Authorization: Bearer <token>'
      });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Formato de token inválido. Se espera "Bearer <token>"'
      });
    }

    // Verificar validez del token
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = payload;

    // Renovar token en cada solicitud válida
    const nuevoToken = generarToken({ userId: payload.userId, email: payload.email });
    res.setHeader('x-renewed-token', nuevoToken);

    next();
  } catch (error) {
    console.error('Error al verificar token:', error.message);
    return res.status(401).json({
      status: 'fail',
      message: 'Token inválido o expirado'
    });
  }
}

module.exports = { verificarToken, generarToken };
