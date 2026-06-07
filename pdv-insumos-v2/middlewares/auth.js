function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.status(401).json({ ok: false, motivo: 'No autenticado' });
}
module.exports = { requireAuth };
