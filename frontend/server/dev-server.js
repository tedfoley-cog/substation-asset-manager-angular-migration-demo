'use strict';
// Static dev server for the AngularJS client. Serves src/ on :3000, maps /vendor/* to node_modules/*
// and proxies /api/* to the Spring Boot service (BACKEND_URL, default http://localhost:8080).
const http = require('http');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');

const PORT = Number(process.env.PORT || 3000);
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const ROOT = path.join(__dirname, '..', 'src');
const VENDOR = path.join(__dirname, '..', 'node_modules');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.map': 'application/json', '.woff2': 'font/woff2' };

const proxy = httpProxy.createProxyServer({ target: BACKEND_URL, changeOrigin: true });
proxy.on('error', (err, req, res) => {
  res.writeHead(502, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 502, error: 'Bad Gateway', message: 'Asset service unreachable at ' + BACKEND_URL, path: req.url }));
});

function send(res, file) {
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url.startsWith('/api/')) return proxy.web(req, res);
  if (url.startsWith('/vendor/')) return send(res, path.join(VENDOR, url.slice('/vendor/'.length)));
  if (url === '/' || !path.extname(url)) return send(res, path.join(ROOT, 'index.html'));
  const file = path.normalize(path.join(ROOT, url));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  send(res, file);
}).listen(PORT, () => console.log(`sam-web on http://localhost:${PORT} (api -> ${BACKEND_URL})`));
