const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth(), async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const r = await db.query('INSERT INTO etiquetas (nombre) VALUES ($1) RETURNING *', [nombre]);
    res.json(r.rows[0]);
  } catch {
    res.status(400).json({ error: 'Etiqueta duplicada' });
  }
});

router.get('/', auth(), async (_req, res) => {
  const r = await db.query('SELECT * FROM etiquetas ORDER BY nombre ASC');
  res.json(r.rows);
});

router.post('/asignar', auth(), async (req, res) => {
  const { producto_id, etiqueta_ids } = req.body; // array
  if (!producto_id || !Array.isArray(etiqueta_ids)) return res.status(400).json({ error: 'Datos inválidos' });
  await db.query('BEGIN');
  try {
    await db.query('DELETE FROM productos_etiquetas WHERE producto_id=$1', [producto_id]);
    for (const eid of etiqueta_ids) {
      await db.query('INSERT INTO productos_etiquetas (producto_id, etiqueta_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [producto_id, eid]);
    }
    await db.query('COMMIT');
    res.json({ ok: true });
  } catch {
    await db.query('ROLLBACK');
    res.status(400).json({ error: 'Error al asignar etiquetas' });
  }
});

module.exports = router;
