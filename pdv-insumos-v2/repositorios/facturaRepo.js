const pool = require('../config/db');
async function porVenta(ventaId) {
  const [r] = await pool.query('SELECT * FROM facturas WHERE venta_id = ?', [ventaId]);
  return r[0] || null;
}
async function crear(f) {
  const [r] = await pool.query('INSERT INTO facturas (venta_id, folio, total, fecha) VALUES (?,?,?,?)', [f.venta_id, f.folio, f.total, f.fecha]);
  return r.insertId;
}
async function obtener(id) {
  const [r] = await pool.query('SELECT * FROM facturas WHERE id = ?', [id]);
  return r[0] || null;
}
module.exports = { porVenta, crear, obtener };
