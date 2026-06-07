const clienteService = require('../servicios/clienteService');
async function listar(req, res) { res.json(await clienteService.listar()); }
async function crear(req, res) { const r = await clienteService.crear(req.body); res.status(r.ok ? 200 : 400).json(r); }
module.exports = { listar, crear };
