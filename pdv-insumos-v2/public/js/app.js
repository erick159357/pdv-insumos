let carrito = [];
let productosCache = [];
let grafica = null;

async function api(url, opciones) {
  const r = await fetch(url, opciones);
  let data = null;
  try { data = await r.json(); } catch (e) { data = null; }
  return { status: r.status, data };
}

async function verificarSesion() {
  const { data } = await api('/api/sesion');
  if (!data || !data.ok) { window.location.href = 'index.html'; return; }
  document.getElementById('usuarioActual').textContent = data.usuario + ' (' + data.rol + ')';
}

document.getElementById('btnSalir').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  window.location.href = 'index.html';
});

document.querySelectorAll('#tabs a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('#tabs a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    const tab = a.getAttribute('data-tab');
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('d-none'));
    document.getElementById('tab-' + tab).classList.remove('d-none');
    if (tab === 'productos') cargarProductos();
    if (tab === 'ventas') cargarSelectVentas();
    if (tab === 'alertas') cargarAlertas();
  });
});

async function cargarProductos(q) {
  const url = q ? '/api/productos?q=' + encodeURIComponent(q) : '/api/productos';
  const { data } = await api(url);
  productosCache = data || [];
  const tbody = document.getElementById('tablaProductos');
  tbody.innerHTML = '';
  productosCache.forEach(p => {
    const tr = document.createElement('tr');
    const cad = p.fecha_caducidad ? String(p.fecha_caducidad).substring(0, 10) : '-';
    tr.innerHTML = '<td>' + p.nombre + '</td><td>' + p.categoria + '</td><td>' + p.unidad + '</td>' +
      '<td>$' + Number(p.precio).toFixed(2) + '</td><td>' + p.stock + '</td><td>' + cad + '</td>';
    const td = document.createElement('td');
    td.className = 'text-nowrap';
    const bE = boton('Editar', 'btn-outline-primary', () => editarProducto(p.id));
    const bR = boton('Reabastecer', 'btn-outline-success', () => reabastecer(p.id));
    const bD = boton('Eliminar', 'btn-outline-danger', () => eliminarProducto(p.id));
    td.append(bE, bR, bD);
    tr.append(td);
    tbody.append(tr);
  });
}

function boton(texto, clase, fn) {
  const b = document.createElement('button');
  b.className = 'btn btn-sm ' + clase + ' me-1';
  b.textContent = texto;
  b.addEventListener('click', fn);
  return b;
}

document.getElementById('btnBuscar').addEventListener('click', () => cargarProductos(document.getElementById('busqueda').value.trim()));
document.getElementById('btnNuevo').addEventListener('click', () => abrirFormProducto());
document.getElementById('btnCancelar').addEventListener('click', () => document.getElementById('formProducto').classList.add('d-none'));
document.getElementById('btnGuardar').addEventListener('click', guardarProducto);

function abrirFormProducto(p) {
  document.getElementById('formProducto').classList.remove('d-none');
  document.getElementById('formMsg').textContent = '';
  document.getElementById('formTitulo').textContent = p ? 'Editar producto' : 'Nuevo producto';
  document.getElementById('prodId').value = p ? p.id : '';
  document.getElementById('prodNombre').value = p ? p.nombre : '';
  document.getElementById('prodCategoria').value = p ? p.categoria : 'semilla';
  document.getElementById('prodUnidad').value = p ? p.unidad : 'kilogramo';
  document.getElementById('prodPrecio').value = p ? p.precio : '';
  document.getElementById('prodStock').value = p ? p.stock : 0;
  document.getElementById('prodPerecedero').checked = p ? !!p.perecedero : false;
  document.getElementById('prodCaducidad').value = p && p.fecha_caducidad ? String(p.fecha_caducidad).substring(0, 10) : '';
}

function editarProducto(id) {
  const p = productosCache.find(x => x.id === id);
  abrirFormProducto(p);
}

async function guardarProducto() {
  const id = document.getElementById('prodId').value;
  const cuerpo = {
    nombre: document.getElementById('prodNombre').value.trim(),
    categoria: document.getElementById('prodCategoria').value,
    unidad: document.getElementById('prodUnidad').value,
    precio: Number(document.getElementById('prodPrecio').value),
    stock: Number(document.getElementById('prodStock').value),
    perecedero: document.getElementById('prodPerecedero').checked,
    fecha_caducidad: document.getElementById('prodCaducidad').value || null
  };
  const url = id ? '/api/productos/' + id : '/api/productos';
  const metodo = id ? 'PUT' : 'POST';
  const { data } = await api(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  if (data && data.ok) {
    document.getElementById('formProducto').classList.add('d-none');
    cargarProductos();
  } else {
    const errores = data && data.errores ? data.errores.join('. ') : (data && data.motivo) || 'No fue posible guardar';
    document.getElementById('formMsg').textContent = errores;
  }
}

async function eliminarProducto(id) {
  if (!confirm('Eliminar este producto?')) return;
  const { data } = await api('/api/productos/' + id, { method: 'DELETE' });
  if (data && data.ok) cargarProductos();
  else alert(data && data.motivo ? data.motivo : 'No fue posible eliminar');
}

async function reabastecer(id) {
  const cantidad = Number(prompt('Cantidad a ingresar:'));
  if (!(cantidad > 0)) return;
  const { data } = await api('/api/productos/' + id + '/reabastecer', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cantidad })
  });
  if (data && data.ok) cargarProductos();
  else alert(data && data.motivo ? data.motivo : 'No fue posible reabastecer');
}

async function cargarSelectVentas() {
  const { data } = await api('/api/productos');
  productosCache = data || [];
  const sel = document.getElementById('ventaProducto');
  sel.innerHTML = '';
  productosCache.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.nombre + ' (existencia: ' + p.stock + ', $' + Number(p.precio).toFixed(2) + ')';
    sel.append(o);
  });
}

document.getElementById('btnAgregar').addEventListener('click', () => {
  const id = Number(document.getElementById('ventaProducto').value);
  const cantidad = Number(document.getElementById('ventaCantidad').value);
  const p = productosCache.find(x => x.id === id);
  if (!p || !(cantidad > 0)) return;
  const existente = carrito.find(x => x.producto_id === id);
  if (existente) existente.cantidad += cantidad;
  else carrito.push({ producto_id: id, nombre: p.nombre, precio: Number(p.precio), cantidad });
  pintarCarrito();
});

function pintarCarrito() {
  const tbody = document.getElementById('tablaCarrito');
  tbody.innerHTML = '';
  let total = 0;
  carrito.forEach((it, i) => {
    const sub = it.precio * it.cantidad;
    total += sub;
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + it.nombre + '</td><td>' + it.cantidad + '</td><td>$' + it.precio.toFixed(2) + '</td><td>$' + sub.toFixed(2) + '</td>';
    const td = document.createElement('td');
    td.append(boton('Quitar', 'btn-outline-danger', () => { carrito.splice(i, 1); pintarCarrito(); }));
    tr.append(td);
    tbody.append(tr);
  });
  document.getElementById('ventaTotal').textContent = total.toFixed(2);
}

document.getElementById('btnRegistrarVenta').addEventListener('click', async () => {
  const msg = document.getElementById('ventaMsg');
  if (carrito.length === 0) { msg.innerHTML = '<div class="alert alert-warning py-2">Agregue productos a la venta</div>'; return; }
  const items = carrito.map(x => ({ producto_id: x.producto_id, cantidad: x.cantidad }));
  const { data } = await api('/api/ventas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
  if (data && data.ok) {
    msg.innerHTML = '<div class="alert alert-success py-2">Venta registrada (numero ' + data.venta_id + '), total $' + Number(data.total).toFixed(2) +
      ' <button id="btnFactura" class="btn btn-sm btn-primary ms-2">Generar factura</button></div>';
    document.getElementById('btnFactura').addEventListener('click', () => generarFactura(data.venta_id));
    carrito = [];
    pintarCarrito();
  } else {
    msg.innerHTML = '<div class="alert alert-danger py-2">' + (data && data.motivo ? data.motivo : 'No fue posible registrar la venta') + '</div>';
  }
});

async function generarFactura(ventaId) {
  const { data } = await api('/api/facturas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ venta_id: ventaId }) });
  if (data && data.ok) {
    document.querySelectorAll('#tabs a').forEach(x => x.classList.remove('active'));
    document.querySelector('#tabs a[data-tab="facturas"]').classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('d-none'));
    document.getElementById('tab-facturas').classList.remove('d-none');
    document.getElementById('facturaInfo').innerHTML =
      '<div class="alert alert-info">Factura <b>' + data.factura.folio + '</b>, total $' + Number(data.factura.total).toFixed(2) +
      ' <a class="btn btn-sm btn-outline-primary ms-2" target="_blank" href="/api/facturas/' + data.factura.id + '/pdf">Descargar PDF</a></div>';
  }
}

async function cargarAlertas() {
  const { data } = await api('/api/alertas');
  if (!data) return;
  const lb = document.getElementById('listaBajo');
  const lc = document.getElementById('listaCaducar');
  lb.innerHTML = ''; lc.innerHTML = '';
  data.bajoStock.forEach(p => { const li = document.createElement('li'); li.textContent = p.nombre + ' (existencia: ' + p.stock + ')'; lb.append(li); });
  data.proximosACaducar.forEach(p => { const li = document.createElement('li'); li.textContent = p.nombre + ' (caduca: ' + String(p.fecha_caducidad).substring(0, 10) + ')'; lc.append(li); });
  const { data: prods } = await api('/api/productos');
  const labels = (prods || []).map(p => p.nombre);
  const valores = (prods || []).map(p => p.stock);
  if (grafica) grafica.destroy();
  grafica = new Chart(document.getElementById('graficaStock'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Existencia', data: valores, backgroundColor: '#2f8f4e' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

document.getElementById('btnRefrescarAlertas').addEventListener('click', cargarAlertas);

verificarSesion();
cargarProductos();
