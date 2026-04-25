# Inventario de inmuebles del siglo XX en Rapa Nui

Sitio público del Inventario sXX. Reúne proyectos de Tepuku sobre inmuebles construidos en Rapa Nui durante el siglo XX.

URL pública: https://inmuebles.tepuku.org

## Estructura del repo

```
.
├── index.html       Sitio completo (HTML + CSS + JS)
├── CNAME            Dominio personalizado (no editar)
├── .nojekyll        Configuración GitHub Pages (no editar)
└── README.md        Este archivo
```

## Cómo editar contenido

Todos los textos y datos están en `index.html`.

### Cambiar texto de una sección

1. Abrir `index.html` en un editor (VS Code recomendado)
2. Buscar el texto que querés cambiar (Ctrl+F)
3. Modificar entre las etiquetas HTML (sin tocar las etiquetas mismas)
4. Guardar
5. Commit y push con GitHub Desktop

### Agregar un inmueble al mapa

1. Abrir `index.html`
2. Buscar el array `const inmuebles = [`
3. Copiar una línea existente
4. Pegar antes del corchete de cierre `];`
5. Cambiar los valores: `id`, `nombre`, `año`, `lat`, `lng`, etc.
6. Guardar y publicar

Ejemplo:
```javascript
{id:'BC-001', nombre:'Bodega de Hanga Piko', proyecto:'BC', proyecto_label:'Borde Costero', año:'1900', sector:'Hanga Piko', lat:-27.156, lng:-109.443, color:'#BA7517', tipo:'Industrial', tenencia:'Compañía Explotadora', url:'https://storymaps.arcgis.com/stories/...', descripcion:'Texto descriptivo...'}
```

### Cambiar un hito de la línea de tiempo

Buscar `<div class="hito">` en index.html. Cada hito tiene:
- `<div class="hito-año">` para el año
- `<h4>` para el título
- `<p>` para el texto

## Datos actuales

- **9 inmuebles IFYR**: completos con coordenadas oficiales
- **Borde Costero**: pendiente consolidación de planillas
- **Mataveri**: en preparación

## Capacitación

Documento de uso publicado dentro del sitio en sección Equipo.

## Licencia

Contenido publicado bajo Creative Commons CC BY-NC 4.0.

## Equipo

Tepuku — Centro de Investigaciones Aplicadas en Rapa Nui y Otras Islas
contactotepuku@gmail.com
