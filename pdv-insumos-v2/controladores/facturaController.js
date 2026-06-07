const PDFDocument = require('pdfkit');
const facturaService = require('../servicios/facturaService');
async function generar(req, res) {
  const r = await facturaService.generar(req.body.venta_id);
  res.status(r.ok ? 200 : 404).json(r);
}
async function pdf(req, res) {
  const datos = await facturaService.paraPdf(req.params.id);
  if (!datos) return res.status(404).json({ ok: false, motivo: 'Factura no encontrada' });
  const { factura, items } = datos;
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
  doc.fontSize(18).text('PDV de insumos agricolas', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text('Factura: ' + factura.folio);
  doc.text('Venta numero: ' + factura.venta_id);
  doc.moveDown();
  items.forEach(it => doc.text(it.nombre + '   x' + it.cantidad + '   $' + Number(it.subtotal).toFixed(2)));
  doc.moveDown();
  doc.fontSize(14).text('Total: $' + Number(factura.total).toFixed(2), { align: 'right' });
  doc.end();
}
module.exports = { generar, pdf };
