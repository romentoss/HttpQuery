# HTTP QUERY · Demo del RFC 10008

Demo educativa e interactiva del método HTTP `QUERY` definido en el [RFC 10008](https://www.rfc-editor.org/rfc/rfc10008.html).

`QUERY` es un nuevo verbo HTTP que combina lo mejor de `GET` (seguro, idempotente, cacheable) con la capacidad de llevar un body en la petición (como `POST`). Llega para llenar un vacío histórico del protocolo y reemplazar ese clásico `POST /search` que tantos hemos acabado usando "por necesidad".

![HTTP QUERY demo](https://img.shields.io/badge/RFC-10008-blueviolet?style=flat-square) ![Node](https://img.shields.io/badge/node-%E2%89%A522-339933?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

## ✨ Qué incluye

- 📚 **8 cards educativas**: definición, comparativa `GET`/`QUERY`/`POST`, ejemplo HTTP, header `Accept-Query`, estado de adopción por stack, semáforo de uso y conclusión.
- 🧪 **Sección "Pruébalo en vivo"**: formulario que dispara un `fetch({ method: 'QUERY' })` real contra un endpoint local. Ves la request y la response construirse en tiempo real, con copy-to-clipboard en ambos paneles.
- 🎨 **Tema claro/oscuro** con persistencia en `localStorage`.
- ⚡ **Vanilla JS puro**, sin frameworks ni build step. Solo HTML, CSS y JS en archivos separados.
- 📱 **Responsive**: pensado para escritorio y móvil.
- 🚀 **Servidor Node.js mínimo** (sin Express ni nada) que acepta peticiones `QUERY` reales.

## 🔧 Requisitos

- **Node.js 22 o superior.** El soporte del método `QUERY` en el parser HTTP de Node es experimental y se añadió a partir de la v22.

## 🚀 Cómo usarlo

```bash
git clone https://github.com/romentoss/HttpQuery.git
cd HttpQuery
node server.js
```

Luego abre [http://localhost:8080](http://localhost:8080) en tu navegador.

## 🔬 Probar el endpoint con curl

Si solo quieres ver el endpoint en acción sin abrir el navegador:

```bash
# Filtrar por rol
curl -X QUERY http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -H "Accept-Query: application/json" \
  -d '{"role":"admin"}'

# Filtrar, ordenar y paginar
curl -X QUERY http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"role":"editor","sort":"-name","page":1,"active":true}'
```

## 📁 Estructura

```
httpquery/
├── index.html     # 8 cards + sección Pruébalo en vivo
├── styles.css     # Dashboard moderno, tema claro/oscuro
├── app.js         # Tema, acordeones, copy, fetch con QUERY
├── server.js      # HTTP server mínimo (node:http) con soporte de QUERY
└── README.md
```

## 📖 Sobre RFC 10008

El RFC 10008 se publicó en octubre de 2025 y estandariza el método HTTP `QUERY` junto con el header `Accept-Query` para negociación de capacidades. La adopción todavía está en fase muy temprana:

- 🟡 **Node.js**: soporte experimental en el parser HTTP.
- 🟡 **Express / Fastify**: vía middleware o interceptor.
- 🟡 **ASP.NET Core / Spring**: soporte parcial.
- 🔴 **Navegadores**: sin soporte nativo todavía.

**Recomendación**: úsalo ya en servicios internos donde controlas cliente y servidor. En APIs públicas, mantén siempre un fallback a `GET` o `POST`.

