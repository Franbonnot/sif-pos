const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

// Obtener configuración
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM config LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error al obtener configuración:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Actualizar configuración
router.put('/', async (req, res) => {
  try {
    const { nombre_empresa, direccion, telefono } = req.body;

    const result = await pool.query(
      `UPDATE config 
       SET nombre_empresa = $1, direccion = $2, telefono = $3 
       WHERE id = 1 
       RETURNING *`,
      [nombre_empresa, direccion, telefono]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar configuración:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
