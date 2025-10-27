const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

// Reporte de ventas
router.get('/ventas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.id, v.total, v.fecha, c.nombre AS cliente
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.fecha DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al generar reporte de ventas:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Reporte de inventario
router.get('/inventario', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.nombre, i.cantidad
      FROM inventario i
      JOIN productos p ON i.producto_id = p.id
      ORDER BY p.nombre ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al generar reporte de inventario:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
