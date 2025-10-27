const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth(), async (req, res) => {
  const { producto_id } = req.query;
  const params = [], where = [];
  let sql = `SELECT * FROM variantes`;
  if (producto_id) { params.push(producto_id); where.push(`producto_id=$${params.length}`); }
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ` ORDER BY id DESC`;
  const r = await db.query(sql, params);
  res.json(r.rows);
});

router.post('/', auth(), async (req, res) => {
  const { producto_id, nombre, codigo_barras, precio_costo, precio_venta } = req.body;
  if (!producto_id || !nombre) return res.status(400).json({ error: 'Datos requeridos' });
  try {
    const r = await db.query(
      `INSERT INTO variantes (producto_id, nombre, codigo_barras, precio_costo, precio_venta)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [producto_id, nombre, codigo_barras || null, precio_costo || null, precio_venta || null]
    );
    res.json(r.rows[0]);
  } catch {
    res.status(400).json({ error: 'Código de barras de variante duplicado' });
  }
});

router.put('/:id', auth(), async (req, res) => {
  const { id } = req.params;
  const { nombre, precio_costo, precio_venta, activo } = req.body;
  const r = await db.query(
    `UPDATE variantes SET nombre=$1, precio_costo=$2, precio_venta=$3, activo=$4, actualizado_en=NOW()
     WHERE id=$5 RETURNING *`,
    [nombre, precio_costo, precio_venta, activo, id]
  );
  res.json(r.rows[0]);
});

module.exports = router;
