-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Etiquetas
CREATE TABLE IF NOT EXISTS etiquetas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(80) UNIQUE NOT NULL
);

-- Categorías (opcional)
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(80) UNIQUE NOT NULL
);

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  sku VARCHAR(60) UNIQUE,
  codigo_barras VARCHAR(80) UNIQUE,
  categoria_id INT REFERENCES categorias(id),
  precio_costo NUMERIC(12,2) NOT NULL DEFAULT 0,
  precio_venta NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Relación producto-etiquetas
CREATE TABLE IF NOT EXISTS productos_etiquetas (
  producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
  etiqueta_id INT REFERENCES etiquetas(id) ON DELETE CASCADE,
  PRIMARY KEY (producto_id, etiqueta_id)
);

-- Variantes opcionales
CREATE TABLE IF NOT EXISTS variantes (
  id SERIAL PRIMARY KEY,
  producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
  nombre VARCHAR(120) NOT NULL,
  codigo_barras VARCHAR(80) UNIQUE,
  precio_costo NUMERIC(12,2),
  precio_venta NUMERIC(12,2),
  stock INT NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Movimientos de inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id SERIAL PRIMARY KEY,
  producto_id INT REFERENCES productos(id),
  variante_id INT REFERENCES variantes(id),
  tipo VARCHAR(20) NOT NULL,              -- 'entrada' | 'salida' | 'ajuste'
  cantidad INT NOT NULL,
  motivo VARCHAR(200),
  usuario_id INT REFERENCES usuarios(id),
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Tarjetas y porcentajes
CREATE TABLE IF NOT EXISTS tipos_tarjeta (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS porcentajes_tarjeta (
  id SERIAL PRIMARY KEY,
  tipo_tarjeta_id INT REFERENCES tipos_tarjeta(id) ON DELETE CASCADE,
  porcentaje NUMERIC(5,2) NOT NULL,
  cuotas INT NOT NULL DEFAULT 1
);

-- Ventas e items
CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  total_bruto NUMERIC(12,2) NOT NULL DEFAULT 0,
  recargo_tarjeta NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_final NUMERIC(12,2) NOT NULL DEFAULT 0,
  moneda VARCHAR(10) NOT NULL DEFAULT 'ARS',
  forma_pago VARCHAR(20) NOT NULL,                 -- 'efectivo' | 'tarjeta' | 'transferencia'
  tipo_tarjeta_id INT REFERENCES tipos_tarjeta(id),
  porcentaje_tarjeta_id INT REFERENCES porcentajes_tarjeta(id),
  creado_por INT REFERENCES usuarios(id),
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ventas_items (
  id SERIAL PRIMARY KEY,
  venta_id INT REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id),
  variante_id INT REFERENCES variantes(id),
  cantidad INT NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL
);
