const jwt = require('jsonwebtoken');
require('dotenv').config(); 

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error('FATAL: SECRET_KEY no definida en .env');
}

// Generar token a partir de payload
function generarToken(payload) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

// Middleware para verificar token y renovar
async function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ status: 'fail', message: 'Token no proporcionado' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ status: 'fail', message: 'Formato de token inválido' });
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = payload;

    //  Generar un nuevo token en cada solicitud
    const nuevoToken = generarToken({ userId: payload.userId, email: payload.email });

    // Pasar el token renovado al cliente vía header
    res.setHeader('x-renewed-token', nuevoToken);

    next();
  } catch (err) {
    return res.status(401).json({ status: 'fail', message: 'Token inválido o expirado' });
  }
}

module.exports = { verificarToken, generarToken };
