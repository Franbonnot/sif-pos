// src/server.js
require('dotenv').config(); // en Render no hace falta, pero en local sí
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/etiquetas', require('./routes/etiquetas'));
app.use('/api/variantes', require('./routes/variantes'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/config', require('./routes/config'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/reportes', require('./routes/reportes'));

// Servir frontend desde /public
app.use(express.static(path.join(__dirname, 'public')));

// Para cualquier ruta que no sea /api, devolver index.html
app.get('*', (req, res) => {
  // Evitamos que las rutas de API caigan acá
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta de API no encontrada' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Puerto dinámico (Render asigna uno en process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
