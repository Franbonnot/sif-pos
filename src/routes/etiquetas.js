const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

// Obtener todas las etiquetas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM etiquetas ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener etiquetas:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Crear una nueva etiqueta
router.post('/', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await pool.query(
      'INSERT INTO etiquetas (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear etiqueta:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Actualizar una etiqueta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const result = await pool.query(
      'UPDATE etiquetas SET nombre = $1 WHERE id = $2 RETURNING *',
      [nombre, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar etiqueta:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Eliminar una etiqueta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM etiquetas WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    res.json({ message: 'Etiqueta eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar etiqueta:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
