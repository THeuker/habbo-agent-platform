import http from 'http';

const PORT = process.env.PORT || 3091;
const TARGET = 'http://localhost:3090';

http.createServer((req, res) => {
  const opts = {
    hostname: 'localhost',
    port: 3090,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(opts, (pr) => {
    res.writeHead(pr.statusCode, pr.headers);
    pr.pipe(res);
  });
  proxy.on('error', (e) => { res.writeHead(502); res.end(e.message); });
  req.pipe(proxy);
}).listen(PORT, () => console.log(`Proxy on :${PORT} → ${TARGET}`));
