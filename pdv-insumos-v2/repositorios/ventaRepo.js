const pool = require('../config/db');
async function transaccion(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const r = await fn(conn);
    await conn.commit();
    return r;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
async function obtenerProductoBloqueado(conn, id) {
  const [r] = await conn.query('SELECT * FROM productos WHERE id = ? FOR UPDATE', [id]);
  return r[0] || null;
}
async function insertarVenta(conn, fecha, clienteId, total) {
  const [r] = await conn.query('INSERT INTO ventas (fecha, cliente_id, total) VALUES (?,?,?)', [fecha, clienteId, total]);
  return r.insertId;
}
async function insertarItem(conn, ventaId, it) {
  await conn.query('INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?)',
    [ventaId, it.producto_id, it.cantidad, it.precio, it.subtotal]);
}
async function descontarStock(conn, id, cantidad) {
  await conn.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, id]);
}
async function obtenerVenta(id) {
  const [r] = await pool.query('SELECT * FROM ventas WHERE id = ?', [id]);
  return r[0] || null;
}
async function itemsDeVenta(id) {
  const [r] = await pool.query(
    'SELECT vi.*, p.nombre FROM venta_items vi JOIN productos p ON p.id = vi.producto_id WHERE vi.venta_id = ?', [id]);
  return r;
}
module.exports = { transaccion, obtenerProductoBloqueado, insertarVenta, insertarItem, descontarStock, obtenerVenta, itemsDeVenta };
