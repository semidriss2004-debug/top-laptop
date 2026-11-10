import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let cleanUrl = req.url.split('?')[0];
  let targetFile = cleanUrl === '/' ? 'index.html' : cleanUrl.replace(/^\//, '');
  let filePath = path.join(distDir, targetFile);
  let extname = path.extname(filePath);
  let contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Fallback for SPA routing to index.html
      fs.readFile(path.join(distDir, 'index.html'), (err2, content2) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content2, 'utf-8');
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(` TOP LAPTOP Store is running!`);
  console.log(` Local URL:   http://localhost:${PORT}`);
  console.log(` Network URL: http://127.0.0.1:${PORT}`);
  console.log(`======================================================\n`);

  // Open default browser on Windows
  try {
    exec(`start http://localhost:${PORT}`);
  } catch (e) {
    // Ignore error if start fails
  }
});
