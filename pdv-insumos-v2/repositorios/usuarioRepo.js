const pool = require('../config/db');
async function buscarPorUsuario(usuario) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
  return rows[0] || null;
}
module.exports = { buscarPorUsuario };
