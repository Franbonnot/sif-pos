// src/server.js
require('dotenv').config(); // carga variables de .env en local
const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
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
