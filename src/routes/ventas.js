const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth(), async (req, res) => {
  const { items, forma_pago, tipo_tarjeta_id, porcentaje_tarjeta_id } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Sin items' });
  if (!['efectivo','tarjeta','transferencia'].includes(forma_pago)) return res.status(400).json({ error: 'Forma de pago inválida' });

  await db.query('BEGIN');
  try {
    const total_bruto = items.reduce((s, it) => s + (Number(it.precio_unitario) * Number(it.cantidad)), 0);
    let recargo_tarjeta = 0;
    if (forma_pago === 'tarjeta') {
      if (!tipo_tarjeta_id || !porcentaje_tarjeta_id) throw new Error('Tarjeta/porcentaje requerido');
      const r = await db.query('SELECT porcentaje FROM porcentajes_tarjeta WHERE id=$1 AND tipo_tarjeta_id=$2', [porcentaje_tarjeta_id, tipo_tarjeta_id]);
      if (!r.rowCount) throw new Error('Porcentaje no encontrado');
      const porcentaje = Number(r.rows[0].porcentaje);
      recargo_tarjeta = (total_bruto * porcentaje) / 100;
    }
    const total_final = total_bruto + recargo_tarjeta;

    const venta = await db.query(
      `INSERT INTO ventas (total_bruto, recargo_tarjeta, total_final, moneda, forma_pago, tipo_tarjeta_id, porcentaje_tarjeta_id, creado_por)
       VALUES ($1,$2,$3,'ARS',$4,$5,$6,$7) RETURNING id`,
      [total_bruto, recargo_tarjeta, total_final, forma_pago, tipo_tarjeta_id || null, porcentaje_tarjeta_id || null, req.user.id]
    );
    const venta_id = venta.rows[0].id;

    for (const it of items) {
      await db.query(
        `INSERT INTO ventas_items (venta_id, producto_id, variante_id, cantidad, precio_unitario, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [venta_id, it.producto_id || null, it.variante_id || null, it.cantidad, it.precio_unitario, it.cantidad * it.precio_unitario]
      );
      await db.query(
        `INSERT INTO movimientos_inventario (producto_id, variante_id, tipo, cantidad, motivo, usuario_id)
         VALUES ($1,$2,'salida',$3,'venta',$4)`,
        [it.producto_id || null, it.variante_id || null, it.cantidad, req.user.id]
      );
      if (it.variante_id) {
        await db.query(`UPDATE variantes SET stock = stock - $1, actualizado_en=NOW() WHERE id=$2`, [it.cantidad, it.variante_id]);
      } else {
        await db.query(`UPDATE productos SET stock = stock - $1, actualizado_en=NOW() WHERE id=$2`, [it.cantidad, it.producto_id]);
      }
    }

    await db.query('COMMIT');
    res.json({ id: venta_id, total_bruto, recargo_tarjeta, total_final });
  } catch (e) {
    await db.query('ROLLBACK');
    res.status(400).json({ error: e.message || 'Error al crear venta' });
  }
});

router.get('/', auth(), async (req, res) => {
  const { desde, hasta } = req.query;
  let sql = `SELECT * FROM ventas`;
  const where = [], params = [];
  if (desde) { params.push(desde); where.push(`DATE(creado_en) >= $${params.length}`); }
  if (hasta) { params.push(hasta); where.push(`DATE(creado_en) <= $${params.length}`); }
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ` ORDER BY id DESC`;
  const r = await db.query(sql, params);
  res.json(r.rows);
});

module.exports = router;
