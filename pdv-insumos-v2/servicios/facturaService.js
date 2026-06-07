const reglas = require('../dominio/reglas');
const facturaRepo = require('../repositorios/facturaRepo');
const ventaRepo = require('../repositorios/ventaRepo');
async function generar(ventaId) {
  const venta = await ventaRepo.obtenerVenta(ventaId);
  if (!venta) return { ok: false, motivo: 'Venta no encontrada' };
  const existente = await facturaRepo.porVenta(ventaId);
  if (existente) return { ok: true, factura: existente };
  const folio = reglas.generarFolio(venta.id, venta.fecha);
  const id = await facturaRepo.crear({ venta_id: ventaId, folio, total: venta.total, fecha: new Date() });
  return { ok: true, factura: { id, venta_id: ventaId, folio, total: venta.total } };
}
async function paraPdf(facturaId) {
  const factura = await facturaRepo.obtener(facturaId);
  if (!factura) return null;
  const items = await ventaRepo.itemsDeVenta(factura.venta_id);
  return { factura, items };
}
module.exports = { generar, paraPdf };
