const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const [portText, htmlArg, dataArg, buildArg] = process.argv.slice(2);
if (!portText || !htmlArg || !dataArg || !buildArg) throw new Error('usage: node tools/p1a-art-review-server.cjs <port> <review.html> <data.json> <build-root>');
const htmlPath = path.resolve(htmlArg), dataPath = path.resolve(dataArg), buildRoot = path.resolve(buildArg);
const port = Number(portText);
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  let file = null, type = 'application/octet-stream';
  if (pathname === '/' || pathname === '/review.html') { file = htmlPath; type = 'text/html; charset=utf-8'; }
  else if (pathname === '/data.json') { file = dataPath; type = 'application/json; charset=utf-8'; }
  else {
    const match = pathname.match(/^\/asset\/([0-9a-f-]{36})\.png$/i);
    if (match) {
      const uuid = match[1].toLowerCase();
      const index = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      const row = index.variants.find(item => item.compiledNativePath === `/asset/${uuid}.png`);
      if (row) file = path.join(buildRoot, 'assets/resources/native', uuid.slice(0, 2), `${uuid}.png`);
      type = 'image/png';
    }
  }
  if (!file) { res.writeHead(404); res.end('not found'); return; }
  fs.readFile(file, (error, body) => {
    if (error) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(body);
  });
});
server.listen(port, '127.0.0.1', () => process.stdout.write(JSON.stringify({ host:'127.0.0.1', port, htmlPath, dataPath, buildRoot }) + '\n'));
