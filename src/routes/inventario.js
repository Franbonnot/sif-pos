const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/movimientos', auth(), async (_req, res) => {
  const r = await db.query(
    `SELECT mi.*, p.nombre AS producto, v.nombre AS variante
     FROM movimientos_inventario mi
     LEFT JOIN productos p ON p.id = mi.producto_id
     LEFT JOIN variantes v ON v.id = mi.variante_id
     ORDER BY mi.id DESC`
  );
  res.json(r.rows);
});

router.post('/movimientos', auth(), async (req, res) => {
  const { producto_id, variante_id, tipo, cantidad, motivo } = req.body;
  if (!['entrada','salida','ajuste'].includes(tipo) || !cantidad) return res.status(400).json({ error: 'Datos inválidos' });
  await db.query('BEGIN');
  try {
    await db.query(
      `INSERT INTO movimientos_inventario (producto_id, variante_id, tipo, cantidad, motivo, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [producto_id || null, variante_id || null, tipo, cantidad, motivo || null, req.user.id]
    );
    let delta = cantidad;
    if (tipo === 'salida') delta = -cantidad;
    if (variante_id) {
      await db.query(`UPDATE variantes SET stock = stock + $1, actualizado_en=NOW() WHERE id=$2`, [delta, variante_id]);
    } else {
      await db.query(`UPDATE productos SET stock = stock + $1, actualizado_en=NOW() WHERE id=$2`, [delta, producto_id]);
    }
    await db.query('COMMIT');
    res.json({ ok: true });
  } catch {
    await db.query('ROLLBACK');
    res.status(400).json({ error: 'Error en movimiento' });
  }
});

module.exports = router;
