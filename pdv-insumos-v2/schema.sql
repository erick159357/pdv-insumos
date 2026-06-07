CREATE DATABASE IF NOT EXISTS pdv_insumos CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE pdv_insumos;

DROP TABLE IF EXISTS venta_items;
DROP TABLE IF EXISTS facturas;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  clave_hash VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'ventas'
);

CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  categoria VARCHAR(20) NOT NULL,
  unidad VARCHAR(20) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  perecedero TINYINT(1) NOT NULL DEFAULT 0,
  fecha_caducidad DATE NULL
);

CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  contacto VARCHAR(120) NULL
);

CREATE TABLE ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATETIME NOT NULL,
  cliente_id INT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE venta_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE facturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  folio VARCHAR(30) NOT NULL UNIQUE,
  total DECIMAL(10,2) NOT NULL,
  fecha DATETIME NOT NULL
);

INSERT INTO usuarios (usuario, clave_hash, rol) VALUES
('admin', '$2a$10$6VOvvNbcnccxQu/M0mzfBO/N4XNS5Lyueei2oD6LmGtXczUhpq.9i', 'administrador');

INSERT INTO productos (nombre, categoria, unidad, precio, stock, perecedero, fecha_caducidad) VALUES
('Semilla de maiz hibrido', 'semilla', 'kilogramo', 850.00, 40, 1, '2026-12-31'),
('Fertilizante triple 17', 'fertilizante', 'saco', 720.00, 25, 1, '2027-06-30'),
('Abono organico composta', 'abono', 'saco', 180.00, 60, 1, '2026-09-15'),
('Herbicida glifosato', 'plaguicida', 'litro', 320.00, 15, 1, '2026-08-01'),
('Azadon reforzado', 'herramienta', 'pieza', 250.00, 30, 0, NULL),
('Pala recta', 'herramienta', 'pieza', 210.00, 8, 0, NULL);

CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_caducidad ON productos(fecha_caducidad);
CREATE INDEX idx_venta_items_producto ON venta_items(producto_id);
CREATE INDEX idx_venta_items_venta ON venta_items(venta_id);
CREATE INDEX idx_facturas_venta ON facturas(venta_id);
