import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const replacements = [
  // Emojis (expressed as corrupted UTF-8 literals found in files)
  { from: /ðŸ¤–/g, to: '🤖' },
  { from: /âš¡/g, to: '⚡' },
  { from: /â­ /g, to: '⭐' },
  { from: /ðŸ””/g, to: '🔔' },
  { from: /ðŸ¤”/g, to: '🤔' },
  { from: /ðŸ—\s/g, to: '🗑️ '}, // Corrupted trash icon
  { from: /ðŸ“\s/g, to: '📄 '},
  
  // Accents & Special Chars
  { from: /Ã±/g, to: 'ñ' },
  { from: /Ã³/g, to: 'ó' },
  { from: /Ã¡/g, to: 'á' },
  { from: /Ã©/g, to: 'é' },
  { from: /Ã­/g, to: 'í' },
  { from: /Ãº/g, to: 'ú' },
  { from: /Â¡/g, to: '¡' },
  { from: /Â¿/g, to: '¿' },
  { from: /Ã‘/g, to: 'Ñ' },
  { from: /Ã—/g, to: '✕' },
  { from: /Ã“/g, to: 'Ó' },
  { from: /Ã\s/g, to: 'í' } // common single corruption
];

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Nettoyeé: ${path.relative(ROOT, filePath)}`);
  }
}

const publicDir = path.join(ROOT, 'public');
const jsDir = path.join(publicDir, 'js');

// Procesa index.html
const indexHtml = path.join(publicDir, 'index.html');
if (fs.existsSync(indexHtml)) cleanFile(indexHtml);

// Procesa todos los JS
if (fs.existsSync(jsDir)) {
  fs.readdirSync(jsDir).forEach(file => {
    if (file.endsWith('.js')) cleanFile(path.join(jsDir, file));
  });
}

console.log('✨ Proceso de limpieza de codificación finalizado.');
