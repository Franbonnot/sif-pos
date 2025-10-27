const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

/**
 * Registro de usuario
 */
router.post('/registro', async (req, res) => {
  const { usuario, email, password, password2 } = req.body;

  if (!usuario || !email || !password || !password2) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (password !== password2) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden' });
  }

  try {
    // Verificar si ya existe usuario o email
    const existU = await db.query('SELECT 1 FROM usuarios WHERE usuario=$1', [usuario]);
    if (existU.rowCount) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    const existE = await db.query('SELECT 1 FROM usuarios WHERE email=$1', [email]);
    if (existE.rowCount) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Crear hash de contraseña
    const hash = await bcrypt.hash(password, 12);

    // Insertar usuario
    const r = await db.query(
      'INSERT INTO usuarios (usuario, email, password_hash) VALUES ($1,$2,$3) RETURNING id, usuario, email',
      [usuario, email, hash]
    );

    res.json({ ok: true, usuario: r.rows[0].usuario, email: r.rows[0].email });
  } catch (e) {
    console.error('Error en registro:', e); // 👈 Esto te muestra el error real en consola
    res.status(400).json({ error: 'Error al registrar', detail: e.message });
  }
});

/**
 * Login de usuario
 */
router.post('/login', async (req, res) => {
  const { userOrEmail, password } = req.body;

  if (!userOrEmail || !password) {
    return res.status(400).json({ error: 'Usuario/correo y contraseña son obligatorios' });
  }

  try {
    const r = await db.query('SELECT * FROM usuarios WHERE usuario=$1 OR email=$1', [userOrEmail]);
    const u = r.rows[0];
    if (!u) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: u.id, usuario: u.usuario, email: u.email },
      process.env.JWT_SECRET,
      { expiresIn: '10h' }
    );

    res.json({ token, usuario: u.usuario });
  } catch (e) {
    console.error('Error en login:', e);
    res.status(500).json({ error: 'Error al iniciar sesión', detail: e.message });
  }
});

module.exports = router;

