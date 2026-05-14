// ============================================
//  Tepuku · Inmuebles sXX
//  Componentes compartidos
// ============================================

// Inserta paraguas + menú al inicio del body
function renderHeader(paginaActiva = '') {
  const html = `
    <div class="paraguas">
      <div class="paraguas-inner">
        <a href="https://www.tepuku.org" class="paraguas-marca" aria-label="Tepuku">
          <img src="/img/logo-tepuku.png" alt="Tepuku">
        </a>
        <ul class="paraguas-links">
          <li><a href="https://www.tepuku.org">tepuku.org</a></li>
          <li><a href="https://fiscales-religiosos.tepuku.org">IFYR</a></li>
          <li><a href="/proyectos/">Borde Costero</a></li>
        </ul>
      </div>
    </div>
    <nav class="menu">
      <div class="menu-inner">
        <a href="/" class="menu-logo">Inmuebles <span>siglo XX</span></a>
        <ul class="menu-nav" id="menu-nav">
          <li><a href="/" data-pagina="inicio">Inicio</a></li>
          <li><a href="/mapa/" data-pagina="mapa">Mapa</a></li>
          <li><a href="/proyectos/" data-pagina="proyectos">Proyectos</a></li>
          <li><a href="/equipo/" data-pagina="equipo">Equipo</a></li>
          <li><a href="/acerca/" data-pagina="acerca">Acerca</a></li>
        </ul>
        <button class="menu-toggle" id="menu-toggle" aria-label="Abrir menú">Menú</button>
      </div>
    </nav>
  `;
  document.body.insertAdjacentHTML('afterbegin', html);

  // Marcar activo
  if (paginaActiva) {
    const link = document.querySelector(`[data-pagina="${paginaActiva}"]`);
    if (link) link.classList.add('activo');
  }

  // Toggle mobile
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('menu-nav').classList.toggle('abierto');
  });
}

// Inserta footer al final del body
function renderFooter() {
  const año = new Date().getFullYear();
  const html = `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div>
            <img src="/img/logo-tepuku.png" alt="Tepuku · Centro de Investigaciones Aplicadas en Rapa Nui y Otras Islas" class="footer-logo">
            <p>Centro de Investigaciones Aplicadas en Rapa Nui y Otras Islas. Investiga y difunde el patrimonio arquitectónico e histórico de la isla a través de inventarios públicos.</p>
          </div>
          <div>
            <h4>Navegar</h4>
            <p><a href="/">Inicio</a></p>
            <p><a href="/mapa/">Mapa</a></p>
            <p><a href="/proyectos/">Proyectos</a></p>
            <p><a href="/equipo/">Equipo</a></p>
            <p><a href="/acerca/">Acerca</a></p>
          </div>
          <div>
            <h4>Proyectos</h4>
            <p><a href="https://fiscales-religiosos.tepuku.org">IFYR · Fiscales y Religiosos</a></p>
            <p><a href="/proyectos/#bc">BC · Borde Costero</a></p>
            <p><a href="/proyectos/#hom">HOM · Hacienda Mataveri</a></p>
          </div>
          <div>
            <h4>Contacto</h4>
            <p><a href="mailto:contactotepuku@gmail.com">contactotepuku@gmail.com</a></p>
            <p><a href="https://www.tepuku.org" target="_blank" rel="noopener">tepuku.org</a></p>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${año} Tepuku · CC BY-NC 4.0</span>
          <span><a href="https://www.tepuku.org" target="_blank" rel="noopener">tepuku.org</a></span>
        </div>
      </div>
    </footer>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

// Carga datos del mapa
async function cargarPuntos() {
  try {
    const r = await fetch('/data/inmuebles.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('No se pudo cargar inmuebles.json');
    return await r.json();
  } catch (e) {
    console.error(e);
    return { puntos: [] };
  }
}
