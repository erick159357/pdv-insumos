# PDV de insumos agricolas (version 1)

Sistema de punto de venta para una tienda de insumos agricolas. Gestiona productos
e inventario con control de caducidad, ventas, facturacion y alertas. Es la version 1
del proyecto, construida como base funcional que sera reingenierada en la fase 7.

## Tecnologias

- Backend: Node.js + Express (API REST)
- Persistencia: MySQL
- Frontend: HTML, CSS y JavaScript (Bootstrap y Chart.js por CDN)
- Seguridad: bcryptjs para el hash de contrasenas y express-session para la sesion
- Facturas en PDF: pdfkit

## Estructura

```
pdv-insumos/
  server.js          Servidor Express con las rutas de la API
  db.js              Conexion a MySQL
  reglas.js          Reglas de negocio (invariantes y validaciones)
  schema.sql         Esquema de base de datos y datos de ejemplo
  public/            Frontend (login, app, css, js)
  test/pruebas.js    Pruebas internas de las reglas de negocio
```

## Como ejecutar

1. Instalar Node.js (version 18 o superior).
2. Iniciar MySQL (por ejemplo con XAMPP).
3. Crear la base de datos importando `schema.sql` en phpMyAdmin, o por consola:
   `mysql -u root < schema.sql`
4. Instalar dependencias: `npm install`
5. Iniciar el servidor: `npm start`
6. Abrir en el navegador: `http://localhost:3000`

Acceso de prueba: usuario `admin`, clave `admin123`.

Si tu MySQL usa otra contrasena de root, ajustala en `db.js`.

## Pruebas internas

`npm test`

Ejecuta las pruebas de las reglas de negocio (existencia no negativa, no vender por
encima de la existencia, no vender caducado, validacion de productos y folio).

## Control de versiones

El proyecto se construyo de forma incremental por componentes. El historial de git
(`git log`) muestra la integracion progresiva: base, autenticacion, productos e
inventario, ventas, facturacion, alertas y pruebas.
