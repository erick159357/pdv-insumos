const pool = require('../config/db');
async function listar(q) {
  if (q) {
    const [r] = await pool.query('SELECT * FROM productos WHERE nombre LIKE ? ORDER BY nombre', ['%' + q + '%']);
    return r;
  }
  const [r] = await pool.query('SELECT * FROM productos ORDER BY nombre');
  return r;
}
async function obtener(id) {
  const [r] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
  return r[0] || null;
}
async function crear(p) {
  const [r] = await pool.query(
    'INSERT INTO productos (nombre, categoria, unidad, precio, stock, perecedero, fecha_caducidad) VALUES (?,?,?,?,?,?,?)',
    [p.nombre, p.categoria, p.unidad, p.precio, p.stock, p.perecedero, p.fecha_caducidad]);
  return r.insertId;
}
async function actualizar(id, p) {
  const [r] = await pool.query(
    'UPDATE productos SET nombre=?, categoria=?, unidad=?, precio=?, stock=?, perecedero=?, fecha_caducidad=? WHERE id=?',
    [p.nombre, p.categoria, p.unidad, p.precio, p.stock, p.perecedero, p.fecha_caducidad, id]);
  return r.affectedRows;
}
async function eliminar(id) {
  const [r] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
  return r.affectedRows;
}
async function tieneVentas(id) {
  const [r] = await pool.query('SELECT COUNT(*) AS n FROM venta_items WHERE producto_id = ?', [id]);
  return r[0].n > 0;
}
async function ajustarStock(id, delta, fcad) {
  await pool.query('UPDATE productos SET stock = stock + ?, fecha_caducidad = ? WHERE id = ?', [delta, fcad, id]);
}
async function bajoStock(umbral) {
  const [r] = await pool.query('SELECT * FROM productos WHERE stock <= ? ORDER BY stock', [umbral]);
  return r;
}
async function proximosACaducar(dias) {
  const [r] = await pool.query(
    'SELECT * FROM productos WHERE perecedero = 1 AND fecha_caducidad IS NOT NULL AND fecha_caducidad <= DATE_ADD(CURDATE(), INTERVAL ? DAY) ORDER BY fecha_caducidad', [dias]);
  return r;
}
module.exports = { listar, obtener, crear, actualizar, eliminar, tieneVentas, ajustarStock, bajoStock, proximosACaducar };
