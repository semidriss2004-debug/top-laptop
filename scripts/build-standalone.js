import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const htmlPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Find CSS and JS files in dist/assets
const files = fs.readdirSync(path.join(distDir, 'assets'));
const cssFile = files.find(f => f.endsWith('.css'));
const jsFile = files.find(f => f.endsWith('.js'));

if (cssFile) {
  const cssContent = fs.readFileSync(path.join(distDir, 'assets', cssFile), 'utf8');
  // Use function replacer to prevent $& / $$ corruption
  html = html.replace(/<link rel="stylesheet"[^>]*>/, () => `<style>\n${cssContent}\n</style>`);
}

if (jsFile) {
  let jsContent = fs.readFileSync(path.join(distDir, 'assets', jsFile), 'utf8');
  // Safely avoid any accidental closing script tag
  jsContent = jsContent.replace(/<\/script>/gi, '<\\/script>');
  // Use function replacer so $& and $$ in minified React code are not replaced
  html = html.replace(/<script type="module"[^>]*><\/script>/, () => `<script>\n${jsContent}\n</script>`);
}

// Embed logo.svg as data URI for favicon
try {
  const logoSvgPath = path.join(rootDir, 'public', 'logo.svg');
  if (fs.existsSync(logoSvgPath)) {
    const logoSvgContent = fs.readFileSync(logoSvgPath, 'utf8');
    const logoBase64 = Buffer.from(logoSvgContent).toString('base64');
    const logoDataUri = `data:image/svg+xml;base64,${logoBase64}`;
    html = html.replace(/href="\.\/logo\.svg"/, () => `href="${logoDataUri}"`);
    html = html.replace(/href="\/logo\.svg"/, () => `href="${logoDataUri}"`);
  }
} catch (e) {
  console.warn('Could not embed logo SVG:', e.message);
}

const standalonePath = path.join(distDir, 'standalone.html');
fs.writeFileSync(standalonePath, html, 'utf8');
console.log(`Generated standalone HTML at: ${standalonePath} (${(html.length / 1024).toFixed(1)} KB)`);
