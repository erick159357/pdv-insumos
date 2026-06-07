const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const api = require('./rutas/api');

const app = express();
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || 'pdv-insumos-secreto', resave: false, saveUninitialized: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', api);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor PDV (v2) escuchando en el puerto ' + PORT));
