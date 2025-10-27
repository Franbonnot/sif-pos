const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Crear un nuevo producto
router.post('/', async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;
    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    const result = await pool.query(
      'INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *',
      [nombre, precio, stock || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear producto:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Actualizar un producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, stock } = req.body;

    const result = await pool.query(
      'UPDATE productos SET nombre = $1, precio = $2, stock = $3 WHERE id = $4 RETURNING *',
      [nombre, precio, stock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar producto:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Eliminar un producto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM productos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
