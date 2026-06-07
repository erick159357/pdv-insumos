Sistema de punto de venta para una tienda de insumos agricolas. Gestiona productos
e inventario con control de caducidad, ventas, facturacion y alertas. Es la version 1.

## Tecnologias que se usaron
- Backend: Node.js + Express (API REST)
- Persistencia: MySQL
- Frontend: HTML, CSS y JavaScript (Bootstrap y Chart.js por CDN)
- Seguridad: bcryptjs para el hash de contrasenas y express-session para la sesion
- Facturas en PDF: pdfkit



Acceso de prueba: usuario `admin`, clave `admin123`.



## Pruebas internas

Con `npm test`

Se ejecuta las pruebas de las reglas de negocio (existencia no negativa, no vender por
encima de la existencia, no vender caducado, validacion de productos y folio).


