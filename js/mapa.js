// ============================================
//  Mapa Inmuebles sXX · Leaflet
// ============================================

const COLORES = {
  ifyr: '#8B1A1A',
  bc: '#7A8F4E'
};

const ETIQUETAS_PROYECTO = {
  ifyr: 'Inmuebles fiscales y religiosos',
  bc: 'Borde costero'
};

const ETIQUETAS_CATEGORIA_BC = {
  registrado: 'Registrado · evidencia material',
  ruinas: 'Ruinas · evidencia material',
  documental: 'Solo documentación histórica'
};

function initMapa(opciones = {}) {
  const {
    contenedor = 'mapa',
    interactivo = true,
    centro = [-27.150, -109.428],
    zoom = 14
  } = opciones;

  const map = L.map(contenedor, {
    zoomControl: interactivo,
    scrollWheelZoom: interactivo,
    doubleClickZoom: interactivo,
    dragging: interactivo,
    touchZoom: interactivo
  }).setView(centro, zoom);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap · CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  return map;
}

function crearMarcador(punto) {
  const color = COLORES[punto.proyecto] || COLORES.ifyr;
  return L.circleMarker([punto.lat, punto.lon], {
    radius: 8,
    fillColor: color,
    color: '#fdf6e3',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.9
  });
}

// ============================================
//  Carga de datos
// ============================================

let _puntosCache = null;
let _ifyrResumenCache = null;
let _bcInmueblesCache = null;

async function fetchJSON(url) {
  try {
    // Evita cache obsoleto del navegador durante iteraciones del sitio
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

async function cargarIFYRResumen() {
  if (_ifyrResumenCache !== null) return _ifyrResumenCache;
  const data = await fetchJSON('/data/ifyr_resumen.json');
  _ifyrResumenCache = data ? (data.inmuebles || []) : [];
  return _ifyrResumenCache;
}

async function cargarBCInmuebles() {
  if (_bcInmueblesCache !== null) return _bcInmueblesCache;
  const data = await fetchJSON('/data/bc_inmuebles.json');
  _bcInmueblesCache = data ? (data.zonas || {}) : {};
  return _bcInmueblesCache;
}

// ============================================
//  Tooltip y click sobre marcadores
// ============================================

function tooltipGenerico(punto) {
  return `
    <div class="tooltip-mapa">
      <div class="tooltip-titulo">${punto.nombre}</div>
    </div>
  `;
}

// ============================================
//  Panel lateral derecho
// ============================================

async function abrirPanelDetalle(id) {
  if (!_puntosCache) {
    const data = await cargarPuntos();
    _puntosCache = data.puntos;
  }

  const punto = _puntosCache.find(p => p.id === id);
  if (!punto) return;

  const panel = document.getElementById('panel-detalle');
  const color = COLORES[punto.proyecto] || COLORES.ifyr;
  panel.style.setProperty('--panel-color', color);
  panel.dataset.proyecto = punto.proyecto;

  panel.querySelector('.panel-tipo').textContent =
    `${ETIQUETAS_PROYECTO[punto.proyecto] || ''} · ${punto.id}`;
  panel.querySelector('.panel-titulo').textContent = punto.nombre;

  // Botón "Ir al sitio del proyecto" — destino al sitio del proyecto.
  // (El sitio IFYR no expone URLs deep-link por inmueble que sean estables,
  // por eso apuntamos a la raíz, como hace la página /proyectos/.)
  const btnSitio = document.getElementById('panel-sitio-proyecto');
  if (btnSitio) {
    btnSitio.href = punto.proyecto === 'ifyr'
      ? 'https://fiscales-religiosos.tepuku.org/'
      : 'https://storymaps.arcgis.com/stories/9f980fd024cd4f03a6fa28a7ae027804';
  }

  // Pan & zoom al punto en el mapa interactivo, compensando el ancho del
  // panel lateral derecho para que el marcador quede centrado en la zona
  // visible del mapa (no tapado por el panel).
  if (typeof _map !== 'undefined' && _map && _map.project) {
    const zoomDestino = punto.proyecto === 'ifyr' ? 17 : 15;
    // Anchura efectiva del panel cuando esté abierto
    const panelAncho = panel.getBoundingClientRect().width || 460;
    const pixelDestino = _map.project([punto.lat, punto.lon], zoomDestino);
    // Mover el "centro" del mapa hacia la derecha del punto en panelAncho/2,
    // de modo que el punto quede a la izquierda del centro real, alineado
    // con el centro de la zona visible (no cubierta por el panel).
    const centroCompensado = _map.unproject(
      pixelDestino.add([panelAncho / 2, 0]),
      zoomDestino
    );
    _map.flyTo(centroCompensado, zoomDestino, {
      animate: true,
      duration: 0.6
    });
  }

  // Estado de carga
  panel.querySelector('.panel-imagen-wrapper').innerHTML = placeholderImagen(punto);
  panel.querySelector('.panel-cuerpo').innerHTML = '<p class="lead">Cargando ficha…</p>';

  // Abrir panel inmediatamente (se llena cuando termina la carga)
  panel.classList.add('activo');
  panel.setAttribute('aria-hidden', 'false');
  panel.scrollTop = 0;
  history.replaceState(null, '', `#${punto.id.toLowerCase()}`);

  // Construir contenido
  const partes = punto.proyecto === 'ifyr'
    ? await construirPanelIFYR(punto)
    : await construirPanelBC(punto);

  panel.querySelector('.panel-imagen-wrapper').innerHTML = partes.imagen;
  panel.querySelector('.panel-cuerpo').innerHTML =
    partes.lead +
    partes.descripcion +
    partes.identificacion +
    partes.estado +
    partes.tecnicos +
    partes.composicion +
    partes.cita +
    partes.enlaces;
}

function cerrarPanelDetalle() {
  const panel = document.getElementById('panel-detalle');
  if (panel) {
    panel.classList.remove('activo');
    panel.setAttribute('aria-hidden', 'true');
  }
  history.replaceState(null, '', window.location.pathname);
}

function copiarURL() {
  navigator.clipboard.writeText(window.location.href);
  const btn = event.target;
  const original = btn.textContent;
  btn.textContent = 'Copiado';
  setTimeout(() => btn.textContent = original, 1500);
}

// Aliases retrocompatibilidad
function abrirModalBC(id) { abrirPanelDetalle(id); }
function cerrarModalBC() { cerrarPanelDetalle(); }

// ============================================
//  Helpers de render compartidos
// ============================================

function placeholderImagen(punto) {
  const color = COLORES[punto.proyecto];
  const inicial = punto.nombre.charAt(0);
  return `
    <div class="panel-imagen-placeholder" style="--panel-color: ${color}">
      <span class="panel-imagen-placeholder-inicial">${inicial}</span>
      <span class="panel-imagen-placeholder-nota">Sin imagen disponible</span>
    </div>
  `;
}

function seccion(titulo, contenidoHTML) {
  if (!contenidoHTML) return '';
  return `
    <section class="panel-seccion">
      <h3 class="panel-seccion-titulo">${titulo}</h3>
      ${contenidoHTML}
    </section>
  `;
}

function renderGrid(campos) {
  const visibles = campos.filter(c =>
    c.valor !== null && c.valor !== undefined && c.valor !== '' && c.valor !== '—'
  );
  if (!visibles.length) return '';
  return `
    <div class="panel-grid">
      ${visibles.map(c => `
        <div class="panel-grid-item">
          <span class="panel-grid-label">${c.label}</span>
          <div class="panel-grid-valor">${c.valor}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderChips(label, items) {
  if (!items || !items.length) return '';
  return `
    <div class="panel-chips-wrapper">
      <div class="panel-chips-label">${label}</div>
      <div class="panel-chips">
        ${items.map(t => `<span class="chip">${t}</span>`).join('')}
      </div>
    </div>
  `;
}

function renderComposicion(items, opciones = {}) {
  if (!items || !items.length) return '';
  // mostrarFichas: para BC se omite el badge inline porque la ficha de conjunto
  // ZCH ya enlaza las fichas individuales. Para IFYR-201 sí se muestra.
  const mostrarFichas = opciones.mostrarFichas !== false;

  return `
    <ol class="panel-composicion panel-composicion--colapsable">
      ${items.map(it => {
        const estado = it.estado ? `<span class="panel-composicion-estado">${it.estado}</span>` : '';
        const anio = it.anio || it.anio_construccion;
        const meta = [it.material, it.dimensiones, it.tipo].filter(Boolean);
        const tieneDetalle = meta.length || it.resumen || it.descripcion;
        const ficha = (mostrarFichas && it.url_ficha_pdf)
          ? `<a href="${it.url_ficha_pdf}" target="_blank" rel="noopener" class="panel-composicion-ficha" onclick="event.stopPropagation()" title="Abrir ficha técnica">📄 Ficha</a>`
          : '';

        const cabecera = `
          <span class="panel-composicion-id">${it.id || ''}</span>
          ${anio ? `<span class="panel-composicion-anio">${anio}</span>` : ''}
          ${estado}
          <span class="panel-composicion-nombre">${it.nombre || '—'}</span>
          ${ficha}
        `;

        // Si no hay detalle expandible, render como item plano (sin summary)
        if (!tieneDetalle) {
          return `<li class="panel-composicion-item panel-composicion-item--simple">
            <div class="panel-composicion-cabecera">${cabecera}</div>
          </li>`;
        }

        const detalleBody = `
          ${meta.length ? `<div class="panel-composicion-meta">${meta.join(' · ')}</div>` : ''}
          ${it.resumen ? `<p class="panel-composicion-resumen">${it.resumen}</p>` : ''}
          ${it.descripcion && it.descripcion !== it.resumen ? `<p class="panel-composicion-resumen">${it.descripcion}</p>` : ''}
        `;

        return `
          <li class="panel-composicion-item">
            <details class="panel-composicion-toggle">
              <summary class="panel-composicion-cabecera">
                ${cabecera}
                <span class="panel-composicion-chevron" aria-hidden="true"></span>
              </summary>
              <div class="panel-composicion-detalle">${detalleBody}</div>
            </details>
          </li>
        `;
      }).join('')}
    </ol>
  `;
}

function renderCita(textoCita) {
  return `
    <div class="panel-cita">
      <strong>Citar:</strong><br>
      ${textoCita}
    </div>
  `;
}

function renderEnlaces(enlaces) {
  const visibles = enlaces.filter(e => e.url);
  if (!visibles.length) return '';
  return `
    <div class="panel-enlaces">
      ${visibles.map(e => `
        <a href="${e.url}" target="_blank" rel="noopener" class="panel-enlace">
          <span class="panel-enlace-icono">${e.icono}</span>
          <span class="panel-enlace-label">${e.label}</span>
        </a>
      `).join('')}
    </div>
  `;
}

// ============================================
//  IFYR · construir partes
// ============================================

async function construirPanelIFYR(punto) {
  const resumen = await cargarIFYRResumen();
  const data = resumen.find(d => d.id === punto.id);

  if (!data) {
    return {
      imagen: placeholderImagen(punto),
      lead: `<p class="lead">Información detallada disponible en el sitio del proyecto IFYR.</p>`,
      identificacion: '',
      estado: '',
      tecnicos: '',
      composicion: '',
      descripcion: '',
      cita: renderCita(
        `Tepuku (2026). ${punto.nombre}, IFYR · ${punto.id}.<br>` +
        `https://inmuebles-sxx.tepuku.org/mapa/#${punto.id.toLowerCase()}`
      ),
      enlaces: renderEnlaces([
        { url: punto.url_externa, icono: '🔗', label: 'Ver en sitio IFYR' }
      ])
    };
  }

  const leadTexto = [data.tipo_propiedad, data.destino_original].filter(Boolean).join(' · ');
  const anio = data.anio_construccion
    ? data.certeza_anio === 'Confirmado'
      ? data.anio_construccion
      : `${data.anio_construccion} (${data.certeza_anio || 's/d'})`
    : null;
  const supEdif = data.superficie_edificada_m2 ? `${data.superficie_edificada_m2} m²` : null;
  const supTerr = data.superficie_terreno_m2 ? `${data.superficie_terreno_m2} m²` : null;

  return {
    imagen: data.foto_portada
      ? `<img src="${data.foto_portada}" alt="${data.denominacion}" class="panel-imagen">`
      : placeholderImagen(punto),
    lead: leadTexto ? `<p class="lead">${leadTexto}</p>` : '',
    identificacion: seccion('Identificación', renderGrid([
      { label: 'Denominación', valor: data.denominacion },
      { label: 'Código de inventario', valor: data.codigo_original },
      { label: 'Zona', valor: data.zona },
      { label: 'Tipo de caso', valor: data.tipo_caso }
    ])),
    estado: seccion('Estado y conservación', renderGrid([
      { label: 'Categoría', valor: data.tipo_caso },
      { label: 'Tipo de evidencia', valor: data.existencia_inmueble },
      { label: 'Estado de conservación', valor: data.estado_edificio },
      { label: 'Grado de alteración', valor: null }
    ])),
    tecnicos: seccion(
      'Datos técnicos',
      renderGrid([
        { label: 'Año de construcción', valor: anio },
        { label: 'Tipo de propiedad', valor: data.tipo_propiedad },
        { label: 'Tipo de tenencia', valor: data.tipo_tenencia },
        { label: 'Destino original', valor: data.destino_original },
        { label: 'Destino actual', valor: data.destino_actual },
        { label: 'Sistema de agrupamiento', valor: data.sistema_agrupamiento },
        { label: 'N° de pisos', valor: data.num_pisos },
        { label: 'Sup. edificada', valor: supEdif },
        { label: 'Sup. terreno', valor: supTerr },
        { label: 'Inmuebles documentados',
          valor: (data.componentes && data.componentes.length) || null }
      ])
    ),
    composicion: data.componentes && data.componentes.length
      ? seccion(
          `Composición · componentes (${data.componentes.length})`,
          renderComposicion(data.componentes)
        )
      : '',
    descripcion: data.descripcion_breve
      ? seccion('Descripción', `<p class="panel-descripcion">${data.descripcion_breve}</p>`)
      : '',
    cita: renderCita(
      `Tepuku (2026). ${data.denominacion}, IFYR · ${punto.id}.<br>` +
      `https://inmuebles-sxx.tepuku.org/mapa/#${punto.id.toLowerCase()}`
    ),
    enlaces: renderEnlaces([
      { url: data.url_ficha_pdf, icono: '📄', label: 'Ficha técnica en PDF' },
      { url: data.url_ficha_fotos_pdf, icono: '📷', label: 'Ficha fotográfica en PDF' },
      { url: data.url_sitio_ifyr || punto.url_externa, icono: '🔗', label: 'Ver en sitio IFYR' }
    ])
  };
}

// ============================================
//  BC · construir partes
// ============================================

async function construirPanelBC(punto) {
  const ficha = punto.ficha || {};
  const categoriaLead = ETIQUETAS_CATEGORIA_BC[ficha.categoria] || 'Zona del borde costero';
  const sector = (ficha.sectores_asociados || []).join(', ') || null;

  const zonasBC = await cargarBCInmuebles();
  const inmueblesZona = zonasBC[punto.id] || [];

  // Una sola denominación. Si rapanui e histórica existen y difieren,
  // mostrar rapanui (principal) con histórica entre paréntesis.
  let denominacion = null;
  const rapa = ficha.denominacion_rapanui;
  const hist = ficha.denominacion_historica;
  if (rapa && hist && rapa !== hist) denominacion = `${rapa} (${hist})`;
  else denominacion = rapa || hist || null;

  return {
    imagen: ficha.foto_principal
      ? `<img src="${ficha.foto_principal}" alt="${punto.nombre}" class="panel-imagen">` +
        (ficha.foto_credito ? `<div class="panel-imagen-credito">${ficha.foto_credito}</div>` : '')
      : placeholderImagen(punto),
    lead: `<p class="lead">${categoriaLead}</p>`,
    identificacion: seccion('Identificación', renderGrid([
      { label: 'Denominación', valor: denominacion },
      { label: 'Código de inventario', valor: punto.id },
      { label: 'Zona', valor: sector },
      { label: 'Tipo de caso', valor: 'Conjunto' }
    ])),
    estado: seccion('Estado y conservación', renderGrid([
      { label: 'Categoría', valor: capitalizar(ficha.categoria) },
      { label: 'Tipo de evidencia', valor: capitalizar(ficha.evidencia) },
      { label: 'Estado de conservación', valor: ficha.estado_conservacion },
      { label: 'Grado de alteración', valor: ficha.grado_alteracion }
    ])),
    tecnicos: seccion(
      'Datos técnicos',
      renderGrid([
        { label: 'Año de construcción', valor: ficha.anio_construccion },
        { label: 'Tipo de propiedad', valor: ficha.tipo_propiedad },
        { label: 'Tipo de tenencia', valor: ficha.tipo_tenencia },
        { label: 'Destino original', valor: ficha.destino_original },
        { label: 'Destino actual', valor: ficha.destino_actual },
        { label: 'Sistema de agrupamiento', valor: ficha.sistema_agrupamiento },
        { label: 'N° de pisos', valor: ficha.num_pisos },
        { label: 'Sup. edificada', valor: ficha.superficie_edificada },
        { label: 'Sup. terreno', valor: ficha.superficie_terreno },
        { label: 'Inmuebles documentados', valor: ficha.inmuebles_documentados }
      ]) + renderChips('Tipos de patrimonio documentado', ficha.tipos_patrimonio)
    ),
    composicion: inmueblesZona.length
      ? seccion(
          `Composición · inmuebles (${inmueblesZona.length})`,
          renderComposicion(inmueblesZona, { mostrarFichas: false })
        )
      : '',
    descripcion: ficha.descripcion
      ? seccion('Descripción', `<p class="panel-descripcion">${ficha.descripcion}</p>`)
      : '',
    cita: renderCita(
      `Tepuku (2026). Zona ${punto.nombre}, Inventario de Borde Costero · ${punto.id}.<br>` +
      `https://inmuebles-sxx.tepuku.org/mapa/#${punto.id.toLowerCase()}`
    ),
    enlaces: renderEnlaces([
      { url: ficha.url_ficha_pdf, icono: '📄', label: 'Ficha de conjunto (ZCH)' },
      { url: ficha.url_storymaps, icono: '🔗', label: 'Ver en StoryMaps de BC' }
    ])
  };
}

function capitalizar(s) {
  if (!s || typeof s !== 'string') return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================
//  Atajos y carga inicial
// ============================================

window.addEventListener('load', () => {
  if (window.location.hash && window.location.pathname.includes('mapa')) {
    const id = window.location.hash.slice(1).toUpperCase();
    setTimeout(() => abrirPanelDetalle(id), 400);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarPanelDetalle();
});

// ============================================
//  Render de marcadores
// ============================================

function renderPuntos(map, puntos, filtros = {}) {
  if (map._puntosLayer) map.removeLayer(map._puntosLayer);

  const grupo = L.layerGroup();
  let visibles = puntos;

  if (filtros.proyecto) {
    visibles = visibles.filter(p => filtros.proyecto.includes(p.proyecto));
  }

  visibles.forEach(p => {
    const m = crearMarcador(p);
    m.bindTooltip(tooltipGenerico(p), {
      direction: 'top',
      offset: [0, -12],
      opacity: 1,
      className: `tooltip-mapa--${p.proyecto}`
    });
    m.on('click', () => abrirPanelDetalle(p.id));
    m.on('mouseover', () => {
      m.setStyle({ radius: 11, weight: 3, fillOpacity: 1 });
      const el = m.getElement();
      if (el) el.style.cursor = 'pointer';
    });
    m.on('mouseout', () => {
      m.setStyle({ radius: 8, weight: 2, fillOpacity: 0.9 });
    });
    grupo.addLayer(m);
  });

  grupo.addTo(map);
  map._puntosLayer = grupo;
  return visibles;
}
