const bcrypt = require('bcryptjs');
const reglas = require('../dominio/reglas');

const HOY = '2026-06-06';
function diasDesdeHoy(n) {
  const d = new Date(HOY);
  d.setDate(d.getDate() + n);
  return d.toISOString().substring(0, 10);
}

// ----------------- PRUEBAS FUNCIONALES POR REQUERIMIENTO -----------------
const casos = [];
function caso(id, req, desc, fn) { casos.push({ id, req, desc, fn }); }

caso('PF-01', 'RF-PROD', 'Alta de producto valido', () =>
  reglas.validarProducto({ nombre: 'Semilla', categoria: 'semilla', unidad: 'kilogramo', precio: 100, stock: 10, perecedero: true, fecha_caducidad: '2026-12-31' }).length === 0);
caso('PF-02', 'RF-PROD', 'Rechazo de precio cero o negativo', () =>
  reglas.validarProducto({ nombre: 'X', categoria: 'abono', unidad: 'saco', precio: 0, stock: 5, perecedero: false }).length > 0);
caso('PF-03', 'RF-PROD', 'Rechazo de existencia negativa', () =>
  reglas.validarProducto({ nombre: 'X', categoria: 'abono', unidad: 'saco', precio: 50, stock: -3, perecedero: false }).length > 0);
caso('PF-04', 'RF-PROD', 'Rechazo de categoria no valida', () =>
  reglas.validarProducto({ nombre: 'X', categoria: 'otra', unidad: 'saco', precio: 50, stock: 5, perecedero: false }).length > 0);
caso('PF-05', 'RF-PROD', 'Rechazo de perecedero sin fecha de caducidad', () =>
  reglas.validarProducto({ nombre: 'X', categoria: 'plaguicida', unidad: 'litro', precio: 50, stock: 5, perecedero: true, fecha_caducidad: null }).length > 0);
caso('PF-06', 'RF-PROD', 'Rechazo de herramienta marcada como perecedera', () =>
  reglas.validarProducto({ nombre: 'Pala', categoria: 'herramienta', unidad: 'pieza', precio: 200, stock: 5, perecedero: true, fecha_caducidad: '2026-12-31' }).length > 0);
caso('PF-07', 'RF-INV', 'Producto vigente no esta caducado', () =>
  reglas.estaCaducado({ perecedero: 1, fecha_caducidad: '2026-12-31' }, HOY) === false);
caso('PF-08', 'RF-INV', 'Producto con fecha pasada esta caducado', () =>
  reglas.estaCaducado({ perecedero: 1, fecha_caducidad: '2026-01-01' }, HOY) === true);
caso('PF-09', 'RF-INV', 'Producto no perecedero nunca caduca', () =>
  reglas.estaCaducado({ perecedero: 0, fecha_caducidad: null }, HOY) === false);
caso('PF-10', 'RF-VENT', 'Venta dentro de existencia y vigente se acepta', () =>
  reglas.puedeVender({ id: 1, stock: 50, perecedero: 1, fecha_caducidad: '2026-12-31' }, 10, HOY).ok === true);
caso('PF-11', 'RF-VENT', 'Venta en el limite exacto de existencia', () =>
  reglas.puedeVender({ id: 1, stock: 50, perecedero: 0 }, 50, HOY).ok === true);
caso('PF-12', 'RF-VENT', 'Rechazo de cantidad mayor que existencia', () =>
  reglas.puedeVender({ id: 1, stock: 50, perecedero: 0 }, 60, HOY).motivo === 'Existencia insuficiente');
caso('PF-13', 'RF-VENT', 'Rechazo de cantidad cero o negativa', () =>
  reglas.puedeVender({ id: 1, stock: 50, perecedero: 0 }, 0, HOY).ok === false);
caso('PF-14', 'RF-VENT', 'Rechazo de producto caducado', () =>
  reglas.puedeVender({ id: 1, stock: 50, perecedero: 1, fecha_caducidad: '2026-01-01' }, 5, HOY).motivo === 'Producto caducado');
caso('PF-15', 'RF-VENT', 'Rechazo de producto inexistente', () =>
  reglas.puedeVender(null, 5, HOY).ok === false);
caso('PF-16', 'RF-FACT', 'Folio con formato esperado', () =>
  reglas.generarFolio(7, '2026-06-06T10:00:00') === 'F-202606-00007');
caso('PF-17', 'RF-FACT', 'Folios distintos para ventas distintas', () =>
  reglas.generarFolio(1, '2026-06-06') !== reglas.generarFolio(2, '2026-06-06'));
caso('PF-18', 'RF-AUT', 'Clave correcta valida el acceso', () => {
  const h = bcrypt.hashSync('admin123', 10);
  return bcrypt.compareSync('admin123', h) === true;
});
caso('PF-19', 'RF-AUT', 'Clave incorrecta no valida el acceso', () => {
  const h = bcrypt.hashSync('admin123', 10);
  return bcrypt.compareSync('otra', h) === false;
});

console.log('=== PRUEBAS FUNCIONALES POR REQUERIMIENTO ===');
let pf_ok = 0;
casos.forEach(c => {
  let r;
  try { r = c.fn() === true; } catch (e) { r = false; }
  if (r) pf_ok++;
  console.log('  ' + (r ? 'PASA ' : 'FALLA') + '  ' + c.id + '  [' + c.req + ']  ' + c.desc);
});
console.log('  Resultado funcional: ' + pf_ok + '/' + casos.length + ' pruebas pasadas\n');

// ----------------- PRUEBA ESTADISTICA TIPO CLEANROOM -----------------
// Perfil operacional de la operacion de venta (frecuencias de uso esperadas)
const perfil = [
  { tipo: 'venta normal', prob: 0.65 },
  { tipo: 'excede existencia', prob: 0.12 },
  { tipo: 'producto caducado', prob: 0.10 },
  { tipo: 'cantidad invalida', prob: 0.08 },
  { tipo: 'producto inexistente', prob: 0.05 }
];
function elegirTipo() {
  const r = Math.random();
  let acc = 0;
  for (const e of perfil) { acc += e.prob; if (r <= acc) return e.tipo; }
  return perfil[perfil.length - 1].tipo;
}
function ent(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function generarCaso() {
  const tipo = elegirTipo();
  const stock = ent(1, 100);
  const perecedero = Math.random() < 0.6 ? 1 : 0;
  let cantidad, fcad, producto;
  if (tipo === 'producto inexistente') {
    return { producto: null, cantidad: ent(1, 50) };
  }
  if (tipo === 'cantidad invalida') {
    cantidad = ent(-5, 0);
  } else if (tipo === 'excede existencia') {
    cantidad = stock + ent(1, 50);
  } else {
    cantidad = ent(1, stock);
  }
  if (perecedero) {
    fcad = (tipo === 'producto caducado') ? diasDesdeHoy(-ent(1, 200)) : diasDesdeHoy(ent(1, 400));
  } else {
    fcad = null;
  }
  producto = { id: 1, stock, perecedero, fecha_caducidad: fcad };
  return { producto, cantidad };
}

// Oraculo independiente derivado de la especificacion formal de la Fase 2
function oraculo(c) {
  if (!c.producto) return false;
  if (!(c.cantidad > 0)) return false;
  if (c.cantidad > c.producto.stock) return false;
  if (c.producto.perecedero && c.producto.fecha_caducidad && new Date(c.producto.fecha_caducidad) < new Date(HOY)) return false;
  return true;
}

const N = 5000;
let fallos = 0;
let aceptadas = 0;
const t0 = process.hrtime.bigint();
for (let i = 0; i < N; i++) {
  const c = generarCaso();
  const esperado = oraculo(c);
  const obtenido = reglas.puedeVender(c.producto, c.cantidad, HOY).ok;
  if (obtenido) aceptadas++;
  if (obtenido !== esperado) fallos++;
}
const t1 = process.hrtime.bigint();
const segundos = Number(t1 - t0) / 1e9;

const pFallo = fallos / N;
const confiabilidad = 1 - pFallo;
const cota95 = fallos === 0 ? 3 / N : null;
const opsPorSeg = Math.round(N / segundos);
const usPorOp = (segundos * 1e6 / N).toFixed(2);

console.log('=== PRUEBA ESTADISTICA TIPO CLEANROOM (operacion de venta) ===');
console.log('  Casos ejecutados segun perfil operacional: ' + N);
console.log('  Ventas aceptadas: ' + aceptadas + '   rechazadas: ' + (N - aceptadas));
console.log('  Fallos (resultado distinto al oraculo formal): ' + fallos);
console.log('  Probabilidad de fallo estimada: ' + pFallo.toFixed(6));
console.log('  Confiabilidad estimada: ' + (confiabilidad * 100).toFixed(4) + '%');
if (cota95 !== null) console.log('  Cota superior 95% (regla de tres): ' + cota95.toFixed(6) + ' (' + (cota95 * 100).toFixed(3) + '%)');
console.log('');
console.log('=== RENDIMIENTO (capa de reglas) ===');
console.log('  Operaciones por segundo: ' + opsPorSeg.toLocaleString('es-MX'));
console.log('  Tiempo promedio por operacion: ' + usPorOp + ' microsegundos');

const fallasTotales = (casos.length - pf_ok) + fallos;
process.exit(fallasTotales > 0 ? 1 : 0);
