const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

// Obtener todas las variantes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM variantes ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener variantes:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Crear una nueva variante
router.post('/', async (req, res) => {
  try {
    const { nombre, producto_id } = req.body;
    if (!nombre || !producto_id) {
      return res.status(400).json({ error: 'Nombre y producto_id son requeridos' });
    }

    const result = await pool.query(
      'INSERT INTO variantes (nombre, producto_id) VALUES ($1, $2) RETURNING *',
      [nombre, producto_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear variante:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Actualizar una variante
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, producto_id } = req.body;

    const result = await pool.query(
      'UPDATE variantes SET nombre = $1, producto_id = $2 WHERE id = $3 RETURNING *',
      [nombre, producto_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar variante:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Eliminar una variante
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM variantes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }

    res.json({ message: 'Variante eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar variante:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
