const clienteRepo = require('../repositorios/clienteRepo');
async function listar() { return clienteRepo.listar(); }
async function crear(datos) {
  if (!datos.nombre || datos.nombre.trim() === '') return { ok: false, motivo: 'El nombre es obligatorio' };
  const id = await clienteRepo.crear({ nombre: datos.nombre, contacto: datos.contacto || null });
  return { ok: true, id };
}
module.exports = { listar, crear };
