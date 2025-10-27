const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/tarjetas', auth(), async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const r = await db.query('INSERT INTO tipos_tarjeta (nombre) VALUES ($1) RETURNING *', [nombre]);
    res.json(r.rows[0]);
  } catch {
    res.status(400).json({ error: 'Tarjeta duplicada' });
  }
});

router.get('/tarjetas', auth(), async (_req, res) => {
  const r = await db.query('SELECT * FROM tipos_tarjeta ORDER BY nombre ASC');
  res.json(r.rows);
});

router.post('/porcentajes', auth(), async (req, res) => {
  const { tipo_tarjeta_id, porcentaje, cuotas } = req.body;
  if (!tipo_tarjeta_id || porcentaje == null || !cuotas) return res.status(400).json({ error: 'Datos requeridos' });
  const r = await db.query(
    `INSERT INTO porcentajes_tarjeta (tipo_tarjeta_id, porcentaje, cuotas)
     VALUES ($1,$2,$3) RETURNING *`,
    [tipo_tarjeta_id, porcentaje, cuotas]
  );
  res.json(r.rows[0]);
});

router.get('/porcentajes', auth(), async (req, res) => {
  const { tipo_tarjeta_id } = req.query;
  const params = [], where = [];
  let sql = `SELECT pt.*, tt.nombre AS tarjeta FROM porcentajes_tarjeta pt JOIN tipos_tarjeta tt ON tt.id = pt.tipo_tarjeta_id`;
  if (tipo_tarjeta_id) { params.push(tipo_tarjeta_id); where.push(`pt.tipo_tarjeta_id=$${params.length}`); }
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ` ORDER BY tt.nombre ASC, pt.cuotas ASC`;
  const r = await db.query(sql, params);
  res.json(r.rows);
});

module.exports = router;
