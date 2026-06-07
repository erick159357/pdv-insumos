const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const auth = require('../controladores/authController');
const productos = require('../controladores/productoController');
const ventas = require('../controladores/ventaController');
const facturas = require('../controladores/facturaController');
const clientes = require('../controladores/clienteController');

router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.get('/sesion', auth.sesion);

router.get('/productos', requireAuth, productos.listar);
router.get('/productos/:id', requireAuth, productos.obtener);
router.post('/productos', requireAuth, productos.crear);
router.put('/productos/:id', requireAuth, productos.actualizar);
router.delete('/productos/:id', requireAuth, productos.eliminar);
router.post('/productos/:id/reabastecer', requireAuth, productos.reabastecer);
router.get('/alertas', requireAuth, productos.alertas);

router.get('/clientes', requireAuth, clientes.listar);
router.post('/clientes', requireAuth, clientes.crear);

router.post('/ventas', requireAuth, ventas.registrar);
router.get('/ventas/:id', requireAuth, ventas.obtener);

router.post('/facturas', requireAuth, facturas.generar);
router.get('/facturas/:id/pdf', requireAuth, facturas.pdf);

module.exports = router;
