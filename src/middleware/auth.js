const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');   // ✅ corregido: antes era 'bcrypt'
const jwt = require('jsonwebtoken');
const pool = require('../db');        // tu conexión a PostgreSQL
require('dotenv').config();

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validación básica
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    // Verificar si ya existe
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hashear contraseña con bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Guardar en la base
    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    res.status(201).json({ message: 'Usuario registrado', user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Buscar usuario
    const user = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Comparar contraseña
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.rows[0].id, username: user.rows[0].username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login exitoso', token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
