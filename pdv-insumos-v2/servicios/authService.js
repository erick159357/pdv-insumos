const bcrypt = require('bcryptjs');
const usuarioRepo = require('../repositorios/usuarioRepo');
async function autenticar(usuario, clave) {
  const u = await usuarioRepo.buscarPorUsuario(usuario);
  if (!u) return null;
  if (!bcrypt.compareSync(clave, u.clave_hash)) return null;
  return { usuario: u.usuario, rol: u.rol };
}
module.exports = { autenticar };
