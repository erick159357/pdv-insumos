function validarProducto(p) {
  const errores = [];
  if (!p.nombre || p.nombre.trim() === '') errores.push('El nombre es obligatorio');
  const cats = ['semilla', 'fertilizante', 'abono', 'plaguicida', 'herramienta'];
  if (!cats.includes(p.categoria)) errores.push('Categoria no valida');
  if (!(Number(p.precio) > 0)) errores.push('El precio debe ser mayor que cero');
  if (Number(p.stock) < 0) errores.push('La existencia no puede ser negativa');
  const perecedero = p.perecedero ? 1 : 0;
  if (p.categoria === 'herramienta' && perecedero === 1) errores.push('Una herramienta no puede ser perecedera');
  if (perecedero === 1 && !p.fecha_caducidad) errores.push('Un producto perecedero requiere fecha de caducidad');
  return errores;
}

function estaCaducado(producto, hoy) {
  if (!producto.perecedero) return false;
  if (!producto.fecha_caducidad) return false;
  return new Date(producto.fecha_caducidad) < new Date(hoy);
}

function puedeVender(producto, cantidad, hoy) {
  if (!producto) return { ok: false, motivo: 'Producto no encontrado' };
  if (!(Number(cantidad) > 0)) return { ok: false, motivo: 'La cantidad debe ser mayor que cero' };
  if (Number(cantidad) > Number(producto.stock)) return { ok: false, motivo: 'Existencia insuficiente' };
  if (estaCaducado(producto, hoy)) return { ok: false, motivo: 'Producto caducado' };
  return { ok: true };
}

function generarFolio(idVenta, fecha) {
  const d = new Date(fecha);
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return 'F-' + anio + mes + '-' + String(idVenta).padStart(5, '0');
}

module.exports = { validarProducto, estaCaducado, puedeVender, generarFolio };
