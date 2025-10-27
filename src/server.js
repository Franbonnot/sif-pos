require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/etiquetas', require('./routes/etiquetas'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/variantes', require('./routes/variantes'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/config', require('./routes/config'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/reportes', require('./routes/reportes'));

app.get('/api/init', async (_req, res) => {
  const fs = require('fs');
  const sql = fs.readFileSync(require('path').join(__dirname, 'init.sql'), 'utf8');
  try {
    await db.query(sql);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al inicializar', detail: e.message });
  }
});

app.get('/', (_, res) => res.sendFile('index.html', { root: 'public' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`S.I.F corriendo en puerto ${PORT}`));
