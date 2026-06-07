const assert = require('assert');
const reglas = require('../dominio/reglas');

let pasadas = 0;
let fallidas = 0;
function prueba(nombre, fn) {
  try { fn(); pasadas++; console.log('  OK  ' + nombre); }
  catch (e) { fallidas++; console.log('  FALLO  ' + nombre + ' -> ' + e.message); }
}

const hoy = '2026-06-06';

prueba('validarProducto acepta un producto valido', () => {
  const e = reglas.validarProducto({ nombre: 'Semilla', categoria: 'semilla', unidad: 'kilogramo', precio: 100, stock: 10, perecedero: true, fecha_caducidad: '2026-12-31' });
  assert.strictEqual(e.length, 0);
});

prueba('validarProducto rechaza precio cero o negativo', () => {
  const e = reglas.validarProducto({ nombre: 'X', categoria: 'abono', unidad: 'saco', precio: 0, stock: 5, perecedero: false });
  assert.ok(e.length > 0);
});

prueba('validarProducto rechaza perecedero sin fecha de caducidad', () => {
  const e = reglas.validarProducto({ nombre: 'X', categoria: 'plaguicida', unidad: 'litro', precio: 50, stock: 5, perecedero: true, fecha_caducidad: null });
  assert.ok(e.length > 0);
});

prueba('validarProducto rechaza herramienta marcada como perecedera', () => {
  const e = reglas.validarProducto({ nombre: 'Pala', categoria: 'herramienta', unidad: 'pieza', precio: 200, stock: 5, perecedero: true, fecha_caducidad: '2026-12-31' });
  assert.ok(e.length > 0);
});

prueba('puedeVender acepta venta dentro de existencia y vigente', () => {
  const r = reglas.puedeVender({ id: 1, stock: 50, perecedero: 1, fecha_caducidad: '2026-12-31' }, 10, hoy);
  assert.strictEqual(r.ok, true);
});

prueba('puedeVender en el limite exacto de existencia', () => {
  const r = reglas.puedeVender({ id: 1, stock: 50, perecedero: 0, fecha_caducidad: null }, 50, hoy);
  assert.strictEqual(r.ok, true);
});

prueba('puedeVender rechaza cantidad mayor que existencia', () => {
  const r = reglas.puedeVender({ id: 1, stock: 50, perecedero: 0 }, 60, hoy);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.motivo, 'Existencia insuficiente');
});

prueba('puedeVender rechaza producto caducado', () => {
  const r = reglas.puedeVender({ id: 1, stock: 50, perecedero: 1, fecha_caducidad: '2026-01-01' }, 5, hoy);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.motivo, 'Producto caducado');
});

prueba('puedeVender rechaza producto inexistente', () => {
  const r = reglas.puedeVender(null, 5, hoy);
  assert.strictEqual(r.ok, false);
});

prueba('generarFolio produce un folio con formato esperado', () => {
  const f = reglas.generarFolio(7, '2026-06-06T10:00:00');
  assert.strictEqual(f, 'F-202606-00007');
});

console.log('\nResumen: ' + pasadas + ' pruebas pasadas, ' + fallidas + ' fallidas');
process.exit(fallidas > 0 ? 1 : 0);
