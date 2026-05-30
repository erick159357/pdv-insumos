document.getElementById('btnEntrar').addEventListener('click', entrar);
document.getElementById('clave').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });

async function entrar() {
  const usuario = document.getElementById('usuario').value.trim();
  const clave = document.getElementById('clave').value;
  const msg = document.getElementById('msg');
  msg.textContent = '';
  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, clave })
    });
    const data = await r.json();
    if (data.ok) {
      window.location.href = 'app.html';
    } else {
      msg.textContent = data.motivo || 'No fue posible iniciar sesion';
    }
  } catch (e) {
    msg.textContent = 'Error de conexion con el servidor';
  }
}
