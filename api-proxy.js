const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server that forwards to Next.js on port 3000
const proxy = httpProxy.createProxyServer({ target: 'http://localhost:3000', ws: true });

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend service unavailable' }));
  }
});

const server = http.createServer((req, res) => {
  // Forward all requests to Next.js
  proxy.web(req, res);
});

// Handle WebSocket upgrade for hot reload
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

const PORT = 8001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`API Proxy running on port ${PORT} -> forwarding to Next.js on 3000`);
});
