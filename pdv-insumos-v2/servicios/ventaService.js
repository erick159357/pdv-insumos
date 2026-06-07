const reglas = require('../dominio/reglas');
const ventaRepo = require('../repositorios/ventaRepo');
async function registrar(items, clienteId) {
  if (!Array.isArray(items) || items.length === 0) return { ok: false, motivo: 'La venta no tiene productos' };
  const hoy = new Date();
  return ventaRepo.transaccion(async (conn) => {
    let total = 0;
    const detalle = [];
    for (const it of items) {
      const producto = await ventaRepo.obtenerProductoBloqueado(conn, it.producto_id);
      const ver = reglas.puedeVender(producto, it.cantidad, hoy);
      if (!ver.ok) return { ok: false, motivo: ver.motivo, producto_id: it.producto_id };
      const subtotal = Number(producto.precio) * Number(it.cantidad);
      total += subtotal;
      detalle.push({ producto_id: producto.id, precio: producto.precio, cantidad: it.cantidad, subtotal });
    }
    const ventaId = await ventaRepo.insertarVenta(conn, hoy, clienteId || null, total);
    for (const d of detalle) {
      await ventaRepo.insertarItem(conn, ventaId, d);
      await ventaRepo.descontarStock(conn, d.producto_id, d.cantidad);
    }
    return { ok: true, venta_id: ventaId, total };
  });
}
async function obtener(id) {
  const venta = await ventaRepo.obtenerVenta(id);
  if (!venta) return null;
  const items = await ventaRepo.itemsDeVenta(id);
  return { venta, items };
}
module.exports = { registrar, obtener };
