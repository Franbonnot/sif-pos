// Estado y helpers
const API = '/api';
let TOKEN = '';
let USER = '';

function showMenu(show) {
  const menu = document.getElementById('menu');
  if (menu) menu.style.display = show ? 'block' : 'none';
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  let res;
  try {
    res = await fetch(`${API}${path}`, { ...opts, headers });
  } catch (err) {
    return { error: 'No se puede conectar con el servidor' };
  }
  let data;
  try {
    data = await res.json();
  } catch {
    data = { error: 'Respuesta inválida del servidor' };
  }
  if (!res.ok) return data.error ? data : { error: 'Error HTTP' };
  return data;
}

// UI
const ui = {
  set(html) {
    const el = document.getElementById('contenido');
    if (el) el.innerHTML = html;
  },

  mostrarInicio() {
    showMenu(false);
    ui.set(`
      <h2>Bienvenido</h2>
      <button onclick="ui.mostrarLogin()">Iniciar sesión</button>
      <button class="sec" onclick="ui.mostrarRegistro()">Registrarse</button>
    `);
  },

  mostrarLogin() {
    showMenu(false);
    ui.set(`
      <h2>Iniciar sesión</h2>
      <input type="text" id="loginUser" placeholder="Usuario o correo">
      <input type="password" id="loginPass" placeholder="Contraseña">
      <button onclick="auth.login()">Entrar</button>
      <button class="sec" onclick="ui.mostrarRegistro()">Registrarse</button>
      <div id="msg"></div>
    `);
  },

  mostrarRegistro() {
    showMenu(false);
    ui.set(`
      <h2>Registro</h2>
      <input type="text" id="regUsuario" placeholder="Usuario deseado" required>
      <input type="email" id="regCorreo" placeholder="Correo electrónico" required>
      <input type="password" id="regPass" placeholder="Contraseña" required>
      <input type="password" id="regPass2" placeholder="Confirmar contraseña" required>
      <button onclick="auth.registrar()">Terminar registro</button>
      <button class="sec" onclick="ui.mostrarLogin()">Volver a Iniciar sesión</button>
      <div id="msg"></div>
    `);
  },

  dashboard() {
    showMenu(true);
    ui.set(`
      <h2>Inicio</h2>
      <div class="msg-ok">Sesión iniciada como ${USER}</div>
      <p>Usá el menú para navegar. Configurá etiquetas/tarjetas antes de vender.</p>
    `);
  }
};

// Auth
const auth = {
  async login() {
    const userOrEmail = document.getElementById('loginUser')?.value?.trim();
    const password = document.getElementById('loginPass')?.value;
    const msgEl = document.getElementById('msg');
    if (!userOrEmail || !password) {
      msgEl.innerHTML = `<div class="msg-err">Complete usuario/correo y contraseña</div>`;
      return;
    }
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ userOrEmail, password }) });
    if (data.token) {
      TOKEN = data.token;
      USER = data.usuario;
      msgEl.innerHTML = `<div class="msg-ok">Inicio exitoso. Bienvenido ${USER}</div>`;
      setTimeout(() => ui.dashboard(), 500);
    } else {
      msgEl.innerHTML = `<div class="msg-err">${data.error || 'Error al iniciar sesión'}</div>`;
    }
  },

  async registrar() {
    const usuario = document.getElementById('regUsuario')?.value?.trim();
    const email = document.getElementById('regCorreo')?.value?.trim();
    const password = document.getElementById('regPass')?.value;
    const password2 = document.getElementById('regPass2')?.value;
    const msgEl = document.getElementById('msg');

    if (!usuario || !email || !password || !password2) {
      msgEl.innerHTML = `<div class="msg-err">Todos los campos son obligatorios</div>`;
      return;
    }
    if (password !== password2) {
      msgEl.innerHTML = `<div class="msg-err">Las contraseñas no coinciden</div>`;
      return;
    }

    const data = await api('/auth/registro', { method: 'POST', body: JSON.stringify({ usuario, email, password, password2 }) });
    if (data.ok) {
      ui.set(`
        <h2>Registro exitoso</h2>
        <div class="msg-ok">Se ha registrado correctamente</div>
        <p><strong>Usuario:</strong> ${data.usuario}</p>
        <p><strong>Correo:</strong> ${data.email}</p>
        <button onclick="ui.mostrarLogin()">Iniciar sesión</button>
        <div class="msg-ok" style="margin-top:10px;">Gracias por registrarte en S.I.F</div>
      `);
    } else {
      msgEl.innerHTML = `<div class="msg-err">${data.error || 'Error al registrar'}</div>`;
    }
  }
};

// Navegación del menú (protegida)
function bindMenu() {
  document.querySelectorAll('nav.menu a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const section = link.getAttribute('href').substring(1);
      if (!TOKEN && section !== 'inicio') {
        ui.mostrarLogin();
        return;
      }
      router(section);
    });
  });
}

function router(section) {
  if (section === 'inicio') return ui.dashboard();
  if (section === 'listar-productos') return productos.listar();
  if (section === 'agregar-producto') return productos.form();
  if (section === 'variantes') return variantes.listarPrompt();
  if (section === 'movimientos') return inventario.listar();
  if (section === 'nueva-venta') return ventas.form();
  if (section === 'reportes-ventas') return ui.reportes();
  if (section === 'etiquetas') return config.etiquetas();
  if (section === 'tarjetas') return config.tarjetas();
  ui.set(`<h2>${section}</h2><p>Sección en construcción</p>`);
}

// Módulos (resumen: iguales a la versión anterior, con mensajes y manejo de errores)
const config = {
  async etiquetas() {
    const list = await api('/etiquetas');
    if (list.error) return ui.set(`<div class="msg-err">${list.error}</div>`);
    ui.set(`
      <h2>Etiquetas</h2>
      <div class="card">
        <input id="etqNombre" placeholder="Nombre de etiqueta">
        <button onclick="config.agregarEtiqueta()">Agregar etiqueta</button>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Etiqueta</th></tr></thead>
        <tbody>${list.map(e => `<tr><td>${e.id}</td><td>${e.nombre}</td></tr>`).join('')}</tbody>
      </table>
      <div id="msg"></div>
    `);
  },
  async agregarEtiqueta() {
    const nombre = document.getElementById('etqNombre').value.trim();
    const data = await api('/etiquetas', { method: 'POST', body: JSON.stringify({ nombre }) });
    document.getElementById('msg').innerHTML = data.id ? `<div class="msg-ok">Etiqueta creada</div>` : `<div class="msg-err">${data.error || 'Error'}</div>`;
    config.etiquetas();
  },
  async tarjetas() {
    const tipos = await api('/config/tarjetas');
    const porcentajes = await api('/config/porcentajes');
    if (tipos.error || porcentajes.error) return ui.set(`<div class="msg-err">${tipos.error || porcentajes.error}</div>`);
    ui.set(`
      <h2>Tarjetas</h2>
      <div class="card">
        <h3>Agregar tipo de tarjeta</h3>
        <input id="tarjNombre" placeholder="Nombre (ej: Visa)">
        <button onclick="config.agregarTarjeta()">Agregar tarjeta</button>
      </div>
      <div class="card">
        <h3>Agregar porcentaje/cuotas</h3>
        <select id="tarjTipo">
          ${tipos.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
        </select>
        <input id="tarjPorcentaje" type="number" step="0.01" placeholder="Porcentaje (%)">
        <input id="tarjCuotas" type="number" placeholder="Cuotas">
        <button onclick="config.agregarPorcentaje()">Agregar configuración</button>
      </div>
      <table>
        <thead><tr><th>Tarjeta</th><th>Interés (%)</th><th>Cuotas</th></tr></thead>
        <tbody>${porcentajes.map(p => `<tr><td>${p.tarjeta}</td><td>${p.porcentaje}</td><td>${p.cuotas}</td></tr>`).join('')}</tbody>
      </table>
      <div id="msg"></div>
    `);
  },
  async agregarTarjeta() {
    const nombre = document.getElementById('tarjNombre').value.trim();
    const data = await api('/config/tarjetas', { method: 'POST', body: JSON.stringify({ nombre }) });
    document.getElementById('msg').innerHTML = data.id ? `<div class="msg-ok">Tarjeta creada</div>` : `<div class="msg-err">${data.error || 'Error'}</div>`;
    config.tarjetas();
  },
  async agregarPorcentaje() {
    const tipo_tarjeta_id = Number(document.getElementById('tarjTipo').value);
    const porcentaje = Number(document.getElementById('tarjPorcentaje').value);
    const cuotas = Number(document.getElementById('tarjCuotas').value);
    const data = await api('/config/porcentajes', { method: 'POST', body: JSON.stringify({ tipo_tarjeta_id, porcentaje, cuotas }) });
    document.getElementById('msg').innerHTML = data.id ? `<div class="msg-ok">Configuración agregada</div>` : `<div class="msg-err">${data.error || 'Error'}</div>`;
    config.tarjetas();
  }
};

const productos = {
  async listar() {
    const [items, etiquetas] = await Promise.all([api('/productos'), api('/etiquetas')]);
    if (items.error) return ui.set(`<div class="msg-err">${items.error}</div>`);
    if (etiquetas.error) return ui.set(`<div class="msg-err">${etiquetas.error}</div>`);
    ui.set(`
      <h2>Productos</h2>
      <div class="card">
        <input id="fQ" placeholder="Buscar...">
        <select id="fEtiqueta">
          <option value="">-- etiqueta --</option>
          ${etiquetas.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
        </select>
        <button onclick="productos.buscar()">Filtrar</button>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>SKU</th><th>CBarras</th><th>Stock</th><th>Precio</th><th>Etiquetas</th></tr></thead>
        <tbody>${items.map(p => `
          <tr>
            <td>${p.id}</td><td>${p.nombre}</td><td>${p.sku || ''}</td><td>${p.codigo_barras || ''}</td>
            <td>${p.stock}</td><td>${p.precio_venta}</td><td>${(p.etiquetas || []).join(', ')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    `);
  },
  async buscar() {
    const q = document.getElementById('fQ').value.trim();
    const etiqueta = document.getElementById('fEtiqueta').value;
    const items = await api(`/productos?q=${encodeURIComponent(q)}${etiqueta ? `&etiqueta=${etiqueta}` : ''}`);
    const etiquetas = await api('/etiquetas');
    if (items.error || etiquetas.error) return ui.set(`<div class="msg-err">${items.error || etiquetas.error}</div>`);
    ui.set(`
      <h2>Productos</h2>
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>SKU</th><th>CBarras</th><th>Stock</th><th>Precio</th><th>Etiquetas</th></tr></thead>
        <tbody>${items.map(p => `
          <tr>
            <td>${p.id}</td><td>${p.nombre}</td><td>${p.sku || ''}</td><td>${p.codigo_barras || ''}</td>
            <td>${p.stock}</td><td>${p.precio_venta}</td><td>${(p.etiquetas || []).join(', ')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    `);
  },
  async form() {
    const etiquetas = await api('/etiquetas');
    if (etiquetas.error) return ui.set(`<div class="msg-err">${etiquetas.error}</div>`);
    ui.set(`
      <h2>Agregar producto</h2>
      <div class="card">
        <input id="pNombre" placeholder="Nombre" />
        <input id="pSKU" placeholder="SKU (opcional)" />
        <input id="pCB" placeholder="Código de barras (opcional)" />
        <input id="pCosto" type="number" step="0.01" placeholder="Precio de costo" />
        <input id="pVenta" type="number" step="0.01" placeholder="Precio final (ARS)" />
        <input id="pStockMin" type="number" placeholder="Stock mínimo" />
        <label>Etiquetas:</label>
        <div id="pTags">
          ${etiquetas.map(e => `<label><input type="checkbox" value="${e.id}"> ${e.nombre}</label>`).join(' ')}
        </div>
        <button onclick="productos.crear()">Guardar</button>
        <div id="msg"></div>
      </div>
    `);
  },
  async crear() {
    const body = {
      nombre: document.getElementById('pNombre').value.trim(),
      sku: document.getElementById('pSKU').value.trim() || null,
      codigo_barras: document.getElementById('pCB').value.trim() || null,
      precio_costo: Number(document.getElementById('pCosto').value || 0),
      precio_venta: Number(document.getElementById('pVenta').value || 0),
      stock_minimo: Number(document.getElementById('pStockMin').value || 0)
    };
    const p = await api('/productos', { method: 'POST', body: JSON.stringify(body) });
    const msgEl = document.getElementById('msg');
    if (!p.id) {
      msgEl.innerHTML = `<div class="msg-err">${p.error || 'Error'}</div>`;
      return;
    }
    const selected = Array.from(document.querySelectorAll('#pTags input[type=checkbox]:checked')).map(x => Number(x.value));
    if (selected.length) await api('/etiquetas/asignar', { method: 'POST', body: JSON.stringify({ producto_id: p.id, etiqueta_ids: selected }) });
    msgEl.innerHTML = `<div class="msg-ok">Producto creado (#${p.id})</div>`;
  }
};

const variantes = {
  async listarPrompt() {
    const pid = prompt('ID de producto para ver variantes:');
    if (!pid) return;
    const vs = await api(`/variantes?producto_id=${pid}`);
    if (vs.error) return ui.set(`<div class="msg-err">${vs.error}</div>`);
    ui.set(`
      <h2>Variantes de producto #${Number(pid)}</h2>
      <div class="card">
        <input id="vNombre" placeholder="Nombre de variante (ej: Talle M, Rojo)">
        <input id="vCB" placeholder="Código de barras (opcional)">
        <input id="vCosto" type="number" step="0.01" placeholder="Precio costo (opcional)">
        <input id="vVenta" type="number" step="0.01" placeholder="Precio venta (opcional)">
        <button onclick="variantes.crear(${Number(pid)})">Agregar variante</button>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>CBarras</th><th>Stock</th></tr></thead>
        <tbody>${vs.map(v => `<tr><td>${v.id}</td><td>${v.nombre}</td><td>${v.codigo_barras || ''}</td><td>${v.stock}</td></tr>`).join('')}</tbody>
      </table>
      <div id="msg"></div>
    `);
  },
  async crear(producto_id) {
    const body = {
      producto_id,
      nombre: document.getElementById('vNombre').value.trim(),
      codigo_barras: document.getElementById('vCB').value.trim() || null,
      precio_costo: document.getElementById('vCosto').value ? Number(document.getElementById('vCosto').value) : null,
      precio_venta: document.getElementById('vVenta').value ? Number(document.getElementById('vVenta').value) : null
    };
    const v = await api('/variantes', { method: 'POST', body: JSON.stringify(body) });
    const msgEl = document.getElementById('msg');
    msgEl.innerHTML = v.id ? `<div class="msg-ok">Variante creada (#${v.id})</div>` : `<div class="msg-err">${v.error || 'Error'}</div>`;
    const vs = await api(`/variantes?producto_id=${producto_id}`);
    ui.set(`
      <h2>Variantes de producto #${producto_id}</h2>
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>CBarras</th><th>Stock</th></tr></thead>
        <tbody>${vs.map(x => `<tr><td>${x.id}</td><td>${x.nombre}</td><td>${x.codigo_barras || ''}</td><td>${x.stock}</td></tr>`).join('')}</tbody>
      </table>
      <div id="msg"></div>
    `);
  }
};

const inventario = {
  async listar() {
    const movs = await api('/inventario/movimientos');
    if (movs.error) return ui.set(`<div class="msg-err">${movs.error}</div>`);
    ui.set(`
      <h2>Movimientos de inventario</h2>
      <div class="card">
        <input id="mProd" type="number" placeholder="Producto ID (o vacío si variante)">
        <input id="mVar" type="number" placeholder="Variante ID (opcional)">
        <select id="mTipo"><option>entrada</option><option>salida</option><option>ajuste</option></select>
        <input id="mCant" type="number" placeholder="Cantidad">
        <input id="mMotivo" placeholder="Motivo (opcional)">
        <button onclick="inventario.agregar()">Registrar movimiento</button>
        <div id="msg"></div>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Producto</th><th>Variante</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th><th>Fecha/Hora</th></tr></thead>
        <tbody>${movs.map(m => `<tr><td>${m.id}</td><td>${m.producto || ''}</td><td>${m.variante || ''}</td><td>${m.tipo}</td><td>${m.cantidad}</td><td>${m.motivo || ''}</td><td>${new Date(m.creado_en).toLocaleString()}</td></tr>`).join('')}</tbody>
      </table>
    `);
  },
  async agregar() {
    const body = {
      producto_id: document.getElementById('mProd').value ? Number(document.getElementById('mProd').value) : null,
      variante_id: document.getElementById('mVar').value ? Number(document.getElementById('mVar').value) : null,
      tipo: document.getElementById('mTipo').value,
      cantidad: Number(document.getElementById('mCant').value),
      motivo: document.getElementById('mMotivo').value.trim() || null
    };
    const r = await api('/inventario/movimientos', { method: 'POST', body: JSON.stringify(body) });
    document.getElementById('msg').innerHTML = r.ok ? `<div class="msg-ok">Movimiento registrado</div>` : `<div class="msg-err">${r.error || 'Error'}</div>`;
    inventario.listar();
  }
};

const ventas = {
  async form() {
    const tiposTarjeta = await api('/config/tarjetas');
    const porcentajes = await api('/config/porcentajes');
    if (tiposTarjeta.error || porcentajes.error) return ui.set(`<div class="msg-err">${tiposTarjeta.error || porcentajes.error}</div>`);
    ui.set(`
      <h2>Nueva venta</h2>
      <div class="card">
        <label>Producto (ID):</label>
        <input id="ventaProdId" type="number" placeholder="ID producto (o dejar vacío si variante)">
        <label>Variante (ID):</label>
        <input id="ventaVarId" type="number" placeholder="ID variante (opcional)">
        <label>Cantidad:</label>
        <input id="ventaCant" type="number" placeholder="Cantidad">
        <label>Precio unitario:</label>
        <input id="ventaPrecio" type="number" step="0.01" placeholder="Precio unitario">
        <label>Forma de pago:</label>
        <select id="ventaPago">
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="qr">QR</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
        <div id="tarjetaConf" style="display:none;">
          <label>Tipo de tarjeta:</label>
          <select id="ventaTipoTarjeta">
            ${tiposTarjeta.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
          </select>
          <label>Porcentaje/cuotas:</label>
          <select id="ventaPorcentaje">
            ${porcentajes.map(p => `<option value="${p.id}">${p.tarjeta} - ${p.porcentaje}% - ${p.cuotas} cuotas</option>`).join('')}
          </select>
        </div>
        <button onclick="ventas.crear()">Confirmar venta</button>
        <div id="msg"></div>
      </div>
    `);
    document.getElementById('ventaPago').addEventListener('change', (e) => {
      document.getElementById('tarjetaConf').style.display = e.target.value === 'tarjeta' ? 'block' : 'none';
    });
  },
  async crear() {
    const producto_id = document.getElementById('ventaProdId').value ? Number(document.getElementById('ventaProdId').value) : null;
    const variante_id = document.getElementById('ventaVarId').value ? Number(document.getElementById('ventaVarId').value) : null;
    const cantidad = Number(document.getElementById('ventaCant').value);
    const precio_unitario = Number(document.getElementById('ventaPrecio').value);
    const forma_pago = document.getElementById('ventaPago').value;

    if (!cantidad || !precio_unitario) {
      document.getElementById('msg').innerHTML = `<div class="msg-err">Completa cantidad y precio</div>`;
      return;
    }

    const payload = {
      items: [{ producto_id, variante_id, cantidad, precio_unitario }],
      forma_pago
    };
    if (forma_pago === 'tarjeta') {
      payload.tipo_tarjeta_id = Number(document.getElementById('ventaTipoTarjeta').value);
      payload.porcentaje_tarjeta_id = Number(document.getElementById('ventaPorcentaje').value);
    }

    const r = await api('/ventas', { method: 'POST', body: JSON.stringify(payload) });
    document.getElementById('msg').innerHTML = r.id
      ? `<div class="msg-ok">Venta creada. Total final: ARS ${Number(r.total_final).toFixed(2)}<br>Fecha/Hora: ${new Date(r.creado_en).toLocaleString()}<br>Método: ${forma_pago}</div>`
      : `<div class="msg-err">${r.error || 'Error al crear venta'}</div>`;
  }
};

const reportes = {
  async reportes() {
    ui.set(`
      <h2>Reportes de ventas</h2>
      <div class="card">
        <h3>Por día</h3>
        <input id="repDia" type="date">
        <button onclick="reportes.dia()">Ver</button>
        <div id="repDiaData"></div>
      </div>
      <div class="card">
        <h3>Por mes</h3>
        <input id="repAno" type="number" placeholder="Año">
        <input id="repMes" type="number" placeholder="Mes (1-12)">
        <button onclick="reportes.mes()">Ver</button>
        <div id="repMesData"></div>
      </div>
      <div class="card">
        <h3>Ranking</h3>
        <button onclick="reportes.ranking()">Ver top productos</button>
        <div id="repRanking"></div>
      </div>
      <div class="card">
        <h3>Exportar CSV del día</h3>
        <input id="expDia" type="date">
        <button onclick="reportes.exportDia()">Descargar</button>
      </div>
    `);
  },
  async dia() {
    const fecha = document.getElementById('repDia').value;
    const r = await api(`/reportes/ventas-dia?fecha=${fecha}`);
    if (r.error) return document.getElementById('repDiaData').innerHTML = `<div class="msg-err">${r.error}</div>`;
    document.getElementById('repDiaData').innerHTML = `
      <div class="card">
        <p><strong>Total bruto:</strong> ARS ${Number(r.total_bruto).toFixed(2)}</p>
        <p><strong>Recargo tarjeta:</strong> ARS ${Number(r.recargo_tarjeta).toFixed(2)}</p>
        <p><strong>Total final:</strong> ARS ${Number(r.total_final).toFixed(2)}</p>
        <p><strong>Cantidad de ventas:</strong> ${r.cantidad_ventas}</p>
        <p><strong>Margen estimado:</strong> ARS ${Number(r.margen).toFixed(2)}</p>
      </div>
    `;
  },
  async mes() {
    const ano = document.getElementById('repAno').value;
    const mes = document.getElementById('repMes').value;
    const r = await api(`/reportes/ventas-mes?ano=${ano}&mes=${mes}`);
    if (r.error) return document.getElementById('repMesData').innerHTML = `<div class="msg-err">${r.error}</div>`;
    document.getElementById('repMesData').innerHTML = `
      <div class="card">
        <p><strong>Total bruto:</strong> ARS ${Number(r.total_bruto).toFixed(2)}</p>
        <p><strong>Recargo tarjeta:</strong> ARS ${Number(r.recargo_tarjeta).toFixed(2)}</p>
        <p><strong>Total final:</strong> ARS ${Number(r.total_final).toFixed(2)}</p>
        <p><strong>Cantidad de ventas:</strong> ${r.cantidad_ventas}</p>
        <p><strong>Margen estimado:</strong> ARS ${Number(r.margen).toFixed(2)}</p>
      </div>
    `;
  },
  async ranking() {
    const r = await api('/reportes/ranking');
    if (r.error) return document.getElementById('repRanking').innerHTML = `<div class="msg-err">${r.error}</div>`;
    document.getElementById('repRanking').innerHTML = `
      <table>
        <thead><tr><th>Producto</th><th>Unidades</th></tr></thead>
        <tbody>${r.map(x => `<tr><td>${x.nombre}</td><td>${x.unidades}</td></tr>`).join('')}</tbody>
      </table>
    `;
  },
  async exportDia() {
    const fecha = document.getElementById('expDia').value;
    if (!fecha) return alert('Elegí una fecha');
    window.location = `/api/reportes/export/dia.csv?fecha=${fecha}`;
  }
};

// Inicialización segura
document.addEventListener('DOMContentLoaded', () => {
  ui.mostrarInicio();
  bindMenu();
});
