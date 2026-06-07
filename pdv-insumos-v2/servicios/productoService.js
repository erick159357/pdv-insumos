const reglas = require('../dominio/reglas');
const productoRepo = require('../repositorios/productoRepo');
const UMBRAL_STOCK = 10;
const DIAS_CADUCIDAD = 30;
function normalizar(p) {
  const perecedero = p.perecedero ? 1 : 0;
  return {
    nombre: p.nombre, categoria: p.categoria, unidad: p.unidad,
    precio: p.precio, stock: Number(p.stock) || 0, perecedero,
    fecha_caducidad: perecedero ? p.fecha_caducidad : null
  };
}
async function listar(q) { return productoRepo.listar(q); }
async function obtener(id) { return productoRepo.obtener(id); }
async function crear(datos) {
  const errores = reglas.validarProducto(datos);
  if (errores.length) return { ok: false, errores };
  const id = await productoRepo.crear(normalizar(datos));
  return { ok: true, id };
}
async function actualizar(id, datos) {
  const errores = reglas.validarProducto(datos);
  if (errores.length) return { ok: false, errores };
  const filas = await productoRepo.actualizar(id, normalizar(datos));
  if (!filas) return { ok: false, motivo: 'Producto no encontrado' };
  return { ok: true };
}
async function eliminar(id) {
  if (await productoRepo.tieneVentas(id)) return { ok: false, motivo: 'No se puede eliminar: tiene ventas asociadas' };
  const filas = await productoRepo.eliminar(id);
  if (!filas) return { ok: false, motivo: 'Producto no encontrado' };
  return { ok: true };
}
async function reabastecer(id, cantidad, fechaCaducidad) {
  if (!(Number(cantidad) > 0)) return { ok: false, motivo: 'La cantidad debe ser mayor que cero' };
  const p = await productoRepo.obtener(id);
  if (!p) return { ok: false, motivo: 'Producto no encontrado' };
  let fcad = p.fecha_caducidad;
  if (p.perecedero && fechaCaducidad) fcad = fechaCaducidad;
  await productoRepo.ajustarStock(id, Number(cantidad), fcad);
  return { ok: true };
}
async function alertas() {
  return { bajoStock: await productoRepo.bajoStock(UMBRAL_STOCK), proximosACaducar: await productoRepo.proximosACaducar(DIAS_CADUCIDAD) };
}
module.exports = { listar, obtener, crear, actualizar, eliminar, reabastecer, alertas };
