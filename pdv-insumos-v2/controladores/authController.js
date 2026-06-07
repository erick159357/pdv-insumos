const authService = require('../servicios/authService');
async function login(req, res) {
  const { usuario, clave } = req.body;
  if (!usuario || !clave) return res.status(400).json({ ok: false, motivo: 'Datos incompletos' });
  const u = await authService.autenticar(usuario, clave);
  if (!u) return res.status(401).json({ ok: false, motivo: 'Credenciales invalidas' });
  req.session.usuario = u.usuario;
  req.session.rol = u.rol;
  res.json({ ok: true, usuario: u.usuario, rol: u.rol });
}
function logout(req, res) { req.session.destroy(() => res.json({ ok: true })); }
function sesion(req, res) {
  if (req.session && req.session.usuario) return res.json({ ok: true, usuario: req.session.usuario, rol: req.session.rol });
  res.json({ ok: false });
}
module.exports = { login, logout, sesion };
