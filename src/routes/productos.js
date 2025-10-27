const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth(), async (req, res) => {
  const { q, codigo_barras, sku, etiqueta } = req.query;
  let sql = `
    SELECT p.*,
           COALESCE(json_agg(e.nombre) FILTER (WHERE e.nombre IS NOT NULL), '[]') AS etiquetas
    FROM productos p
    LEFT JOIN productos_etiquetas pe ON pe.producto_id = p.id
    LEFT JOIN etiquetas e ON e.id = pe.etiqueta_id
  `;
  const where = [], params = [];
  if (q) { params.push(`%${q}%`); where.push(`(LOWER(p.nombre) LIKE LOWER($${params.length}))`); }
  if (codigo_barras) { params.push(codigo_barras); where.push(`p.codigo_barras = $${params.length}`); }
  if (sku) { params.push(sku); where.push(`p.sku = $${params.length}`); }
  if (etiqueta) { params.push(etiqueta); where.push(`EXISTS (SELECT 1 FROM productos_etiquetas pe2 WHERE pe2.producto_id=p.id AND pe2.etiqueta_id=$${params.length})`); }
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ` GROUP BY p.id ORDER BY p.id DESC`;
  const r = await db.query(sql, params);
  res.json(r.rows);
});

router.post('/', auth(), async (req, res) => {
  const { nombre, sku, codigo_barras, precio_costo, precio_venta, stock_minimo = 0 } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const r = await db.query(
      `INSERT INTO productos (nombre, sku, codigo_barras, precio_costo, precio_venta, stock_minimo)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nombre, sku || null, codigo_barras || null, precio_costo || 0, precio_venta || 0, stock_minimo]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(400).json({ error: 'SKU o código ya existente' });
  }
});

router.put('/:id', auth(), async (req, res) => {
  const { id } = req.params;
  const { nombre, precio_costo, precio_venta, stock_minimo, activo } = req.body;
  const r = await db.query(
    `UPDATE productos SET nombre=$1, precio_costo=$2, precio_venta=$3, stock_minimo=$4, activo=$5, actualizado_en=NOW()
     WHERE id=$6 RETURNING *`,
    [nombre, precio_costo, precio_venta, stock_minimo, activo, id]
  );
  res.json(r.rows[0]);
});

module.exports = router;
