const productoService = require('../servicios/productoService');
async function listar(req, res) { res.json(await productoService.listar(req.query.q)); }
async function obtener(req, res) {
  const p = await productoService.obtener(req.params.id);
  if (!p) return res.status(404).json({ ok: false, motivo: 'Producto no encontrado' });
  res.json(p);
}
async function crear(req, res) { const r = await productoService.crear(req.body); res.status(r.ok ? 200 : 400).json(r); }
async function actualizar(req, res) { const r = await productoService.actualizar(req.params.id, req.body); res.status(r.ok ? 200 : (r.motivo ? 404 : 400)).json(r); }
async function eliminar(req, res) { const r = await productoService.eliminar(req.params.id); res.status(r.ok ? 200 : 400).json(r); }
async function reabastecer(req, res) { const r = await productoService.reabastecer(req.params.id, req.body.cantidad, req.body.fecha_caducidad); res.status(r.ok ? 200 : 400).json(r); }
async function alertas(req, res) { res.json(await productoService.alertas()); }
module.exports = { listar, obtener, crear, actualizar, eliminar, reabastecer, alertas };
