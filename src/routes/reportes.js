const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/ventas-dia', auth(), async (req, res) => {
  const { fecha } = req.query; // YYYY-MM-DD
  if (!fecha) return res.status(400).json({ error: 'Fecha requerida' });
  const r = await db.query(
    `SELECT
       COALESCE(SUM(total_bruto),0) AS total_bruto,
       COALESCE(SUM(recargo_tarjeta),0) AS recargo_tarjeta,
       COALESCE(SUM(total_final),0) AS total_final,
       COUNT(id) AS cantidad_ventas
     FROM ventas WHERE DATE(creado_en) = $1`, [fecha]
  );
  const m = await db.query(
    `SELECT COALESCE(SUM(
        (COALESCE(vi.precio_unitario,0) - COALESCE(pr.precio_costo, va.precio_costo, 0)) * vi.cantidad
      ),0) AS margen
     FROM ventas_items vi
     LEFT JOIN productos pr ON pr.id = vi.producto_id
     LEFT JOIN variantes va ON va.id = vi.variante_id
     WHERE vi.venta_id IN (SELECT id FROM ventas WHERE DATE(creado_en)=$1)`, [fecha]
  );
  res.json({ ...r.rows[0], margen: m.rows[0].margen });
});

router.get('/ventas-mes', auth(), async (req, res) => {
  const { ano, mes } = req.query;
  if (!ano || !mes) return res.status(400).json({ error: 'Año y mes requeridos' });
  const r = await db.query(
    `SELECT
       COALESCE(SUM(total_bruto),0) AS total_bruto,
       COALESCE(SUM(recargo_tarjeta),0) AS recargo_tarjeta,
       COALESCE(SUM(total_final),0) AS total_final,
       COUNT(id) AS cantidad_ventas
     FROM ventas WHERE EXTRACT(YEAR FROM creado_en)=$1 AND EXTRACT(MONTH FROM creado_en)=$2`, [ano, mes]
  );
  const m = await db.query(
    `SELECT COALESCE(SUM(
        (COALESCE(vi.precio_unitario,0) - COALESCE(pr.precio_costo, va.precio_costo, 0)) * vi.cantidad
      ),0) AS margen
     FROM ventas_items vi
     LEFT JOIN productos pr ON pr.id = vi.producto_id
     LEFT JOIN variantes va ON va.id = vi.variante_id
     WHERE vi.venta_id IN (
       SELECT id FROM ventas WHERE EXTRACT(YEAR FROM creado_en)=$1 AND EXTRACT(MONTH FROM creado_en)=$2
     )`, [ano, mes]
  );
  res.json({ ...r.rows[0], margen: m.rows[0].margen });
});

module.exports = router;
