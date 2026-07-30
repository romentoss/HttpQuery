// server.js — Demo HTTP QUERY (RFC 10008)
// Servidor mínimo con node:http, sin frameworks.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const ROOT = __dirname;

const users = [
    { id: 1, name: 'Ana García', role: 'admin', active: true },
    { id: 2, name: 'Carlos Ruiz', role: 'user', active: true },
    { id: 3, name: 'María López', role: 'admin', active: false },
    { id: 4, name: 'Pedro Martín', role: 'editor', active: true },
    { id: 5, name: 'Lucía Sánchez', role: 'user', active: true },
    { id: 6, name: 'Diego Torres', role: 'admin', active: true },
    { id: 7, name: 'Sofía Navarro', role: 'editor', active: false },
    { id: 8, name: 'Javier Romero', role: 'user', active: true },
    { id: 9, name: 'Elena Castro', role: 'editor', active: true },
    { id: 10, name: 'Roberto Vega', role: 'admin', active: true },
    { id: 11, name: 'Carmen Ortiz', role: 'user', active: false },
    { id: 12, name: 'Andrés Molina', role: 'editor', active: true },
];

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.ico': 'image/x-icon',
};

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, QUERY, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Query');
    res.setHeader('Access-Control-Max-Age', '86400');
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}

function serveStatic(req, res, urlPath) {
    let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return true;
    }
    try {
        const data = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache',
        });
        res.end(data);
        return true;
    } catch (err) {
        return false;
    }
}

function filterUsers(query) {
    let result = [...users];

    if (query.role) {
        result = result.filter((u) => u.role === query.role);
    }
    if (query.active !== undefined) {
        const active = query.active === true || query.active === 'true';
        result = result.filter((u) => u.active === active);
    }
    if (query.sort) {
        const dir = query.sort.startsWith('-') ? -1 : 1;
        const key = query.sort.replace(/^-/, '');
        result.sort((a, b) => {
            const va = a[key];
            const vb = b[key];
            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
            return 0;
        });
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 5);
    const start = (page - 1) * limit;
    const items = result.slice(start, start + limit);

    return {
        items,
        pagination: {
            page,
            limit,
            total: result.length,
            totalPages: Math.max(1, Math.ceil(result.length / limit)),
        },
        query: { received: query, method: 'QUERY' },
    };
}

const server = http.createServer(async (req, res) => {
    setCors(res);

    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Static files (GET only)
    if (req.method === 'GET') {
        if (serveStatic(req, res, req.url.split('?')[0])) return;
    }

    // API: QUERY /api/users
    if (req.method === 'QUERY' && req.url.split('?')[0] === '/api/users') {
        try {
            const raw = await readBody(req);
            const query = raw ? JSON.parse(raw) : {};
            const result = filterUsers(query);
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'public, max-age=30',
            });
            res.end(JSON.stringify(result, null, 2));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad Request', message: err.message }));
        }
        return;
    }

    // API: GET /api/users (para comparar con QUERY)
    if (req.method === 'GET' && req.url.split('?')[0] === '/api/users') {
        const result = filterUsers({});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
        return;
    }

    // Fallback 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', method: req.method, url: req.url }));
});

server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`HTTP QUERY demo server listening on ${url}`);
    console.log('');
    console.log('Pruebas rápidas con curl:');
    console.log(`  curl -X QUERY ${url}/api/users \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"role":"admin","sort":"name","page":1}'`);
    console.log('');
    console.log(`Abre ${url} en el navegador para la demo interactiva.`);
});

// Detección amable: si el Node no reconoce QUERY, fallamos con un mensaje claro.
process.on('uncaughtException', (err) => {
    if (err && /method/i.test(String(err.message))) {
        console.error('\n[ERROR] Tu versión de Node.js no soporta el método HTTP QUERY.');
        console.error('        Necesitas Node.js v22 o superior (soporte experimental).');
        console.error('        Actualiza con: nvm install 22\n');
    } else {
        console.error(err);
    }
    process.exit(1);
});