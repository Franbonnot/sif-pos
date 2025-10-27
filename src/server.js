// src/server.js
require('dotenv').config(); // solo afecta en local, en Render ya están las env vars
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta raíz de prueba (para evitar "Cannot GET /")
app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/etiquetas', require('./routes/etiquetas'));
app.use('/api/variantes', require('./routes/variantes'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/config', require('./routes/config'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/reportes', require('./routes/reportes'));

// Puerto dinámico (Render asigna uno en process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
