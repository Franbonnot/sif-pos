const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

// Obtener todas las ventas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ventas ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener ventas:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Crear una nueva venta
router.post('/', async (req, res) => {
  try {
    const { cliente_id, total } = req.body;
    if (!cliente_id || !total) {
      return res.status(400).json({ error: 'cliente_id y total son requeridos' });
    }

    const result = await pool.query(
      'INSERT INTO ventas (cliente_id, total) VALUES ($1, $2) RETURNING *',
      [cliente_id, total]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear venta:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Actualizar una venta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente_id, total } = req.body;

    const result = await pool.query(
      'UPDATE ventas SET cliente_id = $1, total = $2 WHERE id = $3 RETURNING *',
      [cliente_id, total, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar venta:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Eliminar una venta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM ventas WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json({ message: 'Venta eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar venta:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
