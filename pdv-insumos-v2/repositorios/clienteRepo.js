const pool = require('../config/db');
async function listar() {
  const [r] = await pool.query('SELECT * FROM clientes ORDER BY nombre');
  return r;
}
async function crear(c) {
  const [r] = await pool.query('INSERT INTO clientes (nombre, contacto) VALUES (?,?)', [c.nombre, c.contacto]);
  return r.insertId;
}
module.exports = { listar, crear };
