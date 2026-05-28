const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const path = require('path');
const pool = require('./db');
const reglas = require('./reglas');

const app = express();
app.use(express.json());
app.use(session({
  secret: 'pdv-insumos-secreto',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.status(401).json({ ok: false, motivo: 'No autenticado' });
}

app.post('/api/login', async (req, res) => {
  const { usuario, clave } = req.body;
  if (!usuario || !clave) return res.status(400).json({ ok: false, motivo: 'Datos incompletos' });
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
  if (rows.length === 0) return res.status(401).json({ ok: false, motivo: 'Credenciales invalidas' });
  const u = rows[0];
  const ok = bcrypt.compareSync(clave, u.clave_hash);
  if (!ok) return res.status(401).json({ ok: false, motivo: 'Credenciales invalidas' });
  req.session.usuario = u.usuario;
  req.session.rol = u.rol;
  res.json({ ok: true, usuario: u.usuario, rol: u.rol });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/sesion', (req, res) => {
  if (req.session && req.session.usuario) return res.json({ ok: true, usuario: req.session.usuario, rol: req.session.rol });
  res.json({ ok: false });
});

app.get('/api/productos', requireAuth, async (req, res) => {
  const q = req.query.q;
  let rows;
  if (q) {
    [rows] = await pool.query('SELECT * FROM productos WHERE nombre LIKE ? ORDER BY nombre', ['%' + q + '%']);
  } else {
    [rows] = await pool.query('SELECT * FROM productos ORDER BY nombre');
  }
  res.json(rows);
});

app.get('/api/productos/:id', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ ok: false, motivo: 'Producto no encontrado' });
  res.json(rows[0]);
});

app.post('/api/productos', requireAuth, async (req, res) => {
  const p = req.body;
  const errores = reglas.validarProducto(p);
  if (errores.length > 0) return res.status(400).json({ ok: false, errores });
  const perecedero = p.perecedero ? 1 : 0;
  const fcad = perecedero ? p.fecha_caducidad : null;
  const [r] = await pool.query(
    'INSERT INTO productos (nombre, categoria, unidad, precio, stock, perecedero, fecha_caducidad) VALUES (?,?,?,?,?,?,?)',
    [p.nombre, p.categoria, p.unidad, p.precio, p.stock || 0, perecedero, fcad]);
  res.json({ ok: true, id: r.insertId });
});

app.put('/api/productos/:id', requireAuth, async (req, res) => {
  const p = req.body;
  const errores = reglas.validarProducto(p);
  if (errores.length > 0) return res.status(400).json({ ok: false, errores });
  const perecedero = p.perecedero ? 1 : 0;
  const fcad = perecedero ? p.fecha_caducidad : null;
  const [r] = await pool.query(
    'UPDATE productos SET nombre=?, categoria=?, unidad=?, precio=?, stock=?, perecedero=?, fecha_caducidad=? WHERE id=?',
    [p.nombre, p.categoria, p.unidad, p.precio, p.stock, perecedero, fcad, req.params.id]);
  if (r.affectedRows === 0) return res.status(404).json({ ok: false, motivo: 'Producto no encontrado' });
  res.json({ ok: true });
});

app.delete('/api/productos/:id', requireAuth, async (req, res) => {
  const [u] = await pool.query('SELECT COUNT(*) AS n FROM venta_items WHERE producto_id = ?', [req.params.id]);
  if (u[0].n > 0) return res.status(400).json({ ok: false, motivo: 'No se puede eliminar: tiene ventas asociadas' });
  const [r] = await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
  if (r.affectedRows === 0) return res.status(404).json({ ok: false, motivo: 'Producto no encontrado' });
  res.json({ ok: true });
});

app.post('/api/productos/:id/reabastecer', requireAuth, async (req, res) => {
  const cantidad = Number(req.body.cantidad);
  if (!(cantidad > 0)) return res.status(400).json({ ok: false, motivo: 'La cantidad debe ser mayor que cero' });
  const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ ok: false, motivo: 'Producto no encontrado' });
  let fcad = rows[0].fecha_caducidad;
  if (rows[0].perecedero && req.body.fecha_caducidad) fcad = req.body.fecha_caducidad;
  await pool.query('UPDATE productos SET stock = stock + ?, fecha_caducidad = ? WHERE id = ?', [cantidad, fcad, req.params.id]);
  res.json({ ok: true });
});

app.get('/api/alertas', requireAuth, async (req, res) => {
  const umbral = 10;
  const dias = 30;
  const [bajo] = await pool.query('SELECT * FROM productos WHERE stock <= ? ORDER BY stock', [umbral]);
  const [pronto] = await pool.query(
    'SELECT * FROM productos WHERE perecedero = 1 AND fecha_caducidad IS NOT NULL AND fecha_caducidad <= DATE_ADD(CURDATE(), INTERVAL ? DAY) ORDER BY fecha_caducidad', [dias]);
  res.json({ bajoStock: bajo, proximosACaducar: pronto });
});

app.get('/api/clientes', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clientes ORDER BY nombre');
  res.json(rows);
});

app.post('/api/clientes', requireAuth, async (req, res) => {
  const { nombre, contacto } = req.body;
  if (!nombre || nombre.trim() === '') return res.status(400).json({ ok: false, motivo: 'El nombre es obligatorio' });
  const [r] = await pool.query('INSERT INTO clientes (nombre, contacto) VALUES (?,?)', [nombre, contacto || null]);
  res.json({ ok: true, id: r.insertId });
});

app.post('/api/ventas', requireAuth, async (req, res) => {
  const items = req.body.items;
  const clienteId = req.body.cliente_id || null;
  const hoy = new Date();
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ ok: false, motivo: 'La venta no tiene productos' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let total = 0;
    const detalle = [];
    for (const it of items) {
      const [rows] = await conn.query('SELECT * FROM productos WHERE id = ? FOR UPDATE', [it.producto_id]);
      const producto = rows[0];
      const ver = reglas.puedeVender(producto, it.cantidad, hoy);
      if (!ver.ok) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ ok: false, motivo: ver.motivo, producto_id: it.producto_id });
      }
      const sub = Number(producto.precio) * Number(it.cantidad);
      total += sub;
      detalle.push({ producto, cantidad: it.cantidad, subtotal: sub });
    }
    const [rv] = await conn.query('INSERT INTO ventas (fecha, cliente_id, total) VALUES (?,?,?)', [hoy, clienteId, total]);
    const ventaId = rv.insertId;
    for (const d of detalle) {
      await conn.query('INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?)',
        [ventaId, d.producto.id, d.cantidad, d.producto.precio, d.subtotal]);
      await conn.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [d.cantidad, d.producto.id]);
    }
    await conn.commit();
    conn.release();
    res.json({ ok: true, venta_id: ventaId, total });
  } catch (e) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ ok: false, motivo: 'Error al registrar la venta' });
  }
});

app.get('/api/ventas/:id', requireAuth, async (req, res) => {
  const [v] = await pool.query('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
  if (v.length === 0) return res.status(404).json({ ok: false, motivo: 'Venta no encontrada' });
  const [items] = await pool.query(
    'SELECT vi.*, p.nombre FROM venta_items vi JOIN productos p ON p.id = vi.producto_id WHERE vi.venta_id = ?', [req.params.id]);
  res.json({ venta: v[0], items });
});

app.post('/api/facturas', requireAuth, async (req, res) => {
  const ventaId = req.body.venta_id;
  const [v] = await pool.query('SELECT * FROM ventas WHERE id = ?', [ventaId]);
  if (v.length === 0) return res.status(404).json({ ok: false, motivo: 'Venta no encontrada' });
  const [ya] = await pool.query('SELECT * FROM facturas WHERE venta_id = ?', [ventaId]);
  if (ya.length > 0) return res.json({ ok: true, factura: ya[0] });
  const venta = v[0];
  const folio = reglas.generarFolio(venta.id, venta.fecha);
  const [r] = await pool.query('INSERT INTO facturas (venta_id, folio, total, fecha) VALUES (?,?,?,?)',
    [ventaId, folio, venta.total, new Date()]);
  res.json({ ok: true, factura: { id: r.insertId, venta_id: ventaId, folio, total: venta.total } });
});

app.get('/api/facturas/:id/pdf', requireAuth, async (req, res) => {
  const [f] = await pool.query('SELECT * FROM facturas WHERE id = ?', [req.params.id]);
  if (f.length === 0) return res.status(404).json({ ok: false, motivo: 'Factura no encontrada' });
  const factura = f[0];
  const [items] = await pool.query(
    'SELECT vi.*, p.nombre FROM venta_items vi JOIN productos p ON p.id = vi.producto_id WHERE vi.venta_id = ?', [factura.venta_id]);
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
  doc.fontSize(18).text('PDV de insumos agricolas', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text('Factura: ' + factura.folio);
  doc.text('Venta numero: ' + factura.venta_id);
  doc.moveDown();
  doc.text('Producto', 50, doc.y, { continued: true });
  doc.text('Cant.', 300, doc.y, { continued: true });
  doc.text('Subtotal', 400, doc.y);
  doc.moveDown(0.3);
  items.forEach(it => {
    doc.text(it.nombre, 50, doc.y, { continued: true });
    doc.text(String(it.cantidad), 300, doc.y, { continued: true });
    doc.text('$' + Number(it.subtotal).toFixed(2), 400, doc.y);
  });
  doc.moveDown();
  doc.fontSize(14).text('Total: $' + Number(factura.total).toFixed(2), { align: 'right' });
  doc.end();
});

const PORT = 3000;
app.listen(PORT, () => console.log('Servidor PDV escuchando en el puerto ' + PORT));
