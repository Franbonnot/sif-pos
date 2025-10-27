const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

// Obtener todo el inventario
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventario ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener inventario:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Agregar un nuevo ítem al inventario
router.post('/', async (req, res) => {
  try {
    const { producto_id, cantidad } = req.body;
    if (!producto_id || !cantidad) {
      return res.status(400).json({ error: 'producto_id y cantidad son requeridos' });
    }

    const result = await pool.query(
      'INSERT INTO inventario (producto_id, cantidad) VALUES ($1, $2) RETURNING *',
      [producto_id, cantidad]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al agregar al inventario:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Actualizar cantidad de un ítem
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    const result = await pool.query(
      'UPDATE inventario SET cantidad = $1 WHERE id = $2 RETURNING *',
      [cantidad, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar inventario:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Eliminar un ítem del inventario
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM inventario WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }

    res.json({ message: 'Ítem eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar del inventario:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
