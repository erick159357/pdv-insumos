const ventaService = require('../servicios/ventaService');
async function registrar(req, res) {
  const r = await ventaService.registrar(req.body.items, req.body.cliente_id);
  res.status(r.ok ? 200 : 400).json(r);
}
async function obtener(req, res) {
  const r = await ventaService.obtener(req.params.id);
  if (!r) return res.status(404).json({ ok: false, motivo: 'Venta no encontrada' });
  res.json(r);
}
module.exports = { registrar, obtener };
