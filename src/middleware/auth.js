const jwt = require('jsonwebtoken');

function auth() {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Token inválido' });
    }
  };
}

module.exports = auth;
