import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Diccionario exhaustivo de secuencias corruptas (UTF-8 bytes mostrados como Latin-1)
const replacements = [
  // Emojis y Símbolos
  { from: Buffer.from([0xF0, 0x9F, 0x9a, 0x80]), to: '🚀' },
  { from: Buffer.from([0xF0, 0x9F, 0x8c, 0x8E]), to: '🌍' },
  { from: Buffer.from([0xE2, 0xAD, 0x90]), to: '⭐' },
  { from: Buffer.from([0xF0, 0x9F, 0xA4, 0x96]), to: '🤖' },
  { from: Buffer.from([0xE2, 0x9A, 0xA1]), to: '⚡' },
  { from: Buffer.from([0xF0, 0x9F, 0x94, 0x94]), to: '🔔' },
  { from: Buffer.from([0xF0, 0x9F, 0xA4, 0x94]), to: '🤔' },
  { from: Buffer.from([0xF0, 0x9F, 0x94, 0x8D]), to: '🔍' },
  { from: Buffer.from([0xF0, 0x9F, 0x91, 0xBE]), to: '👾' },
  { from: Buffer.from([0xF0, 0x9F, 0x93, 0x9D]), to: '📝' },
  { from: Buffer.from([0xF0, 0x9F, 0x92, 0xAC]), to: '💬' },
  { from: Buffer.from([0xF0, 0x9F, 0x94, 0x8D]), to: '🔍' },
  
  // Acentos y Ñ
  { from: Buffer.from([0xC3, 0xB1]), to: 'ñ' },
  { from: Buffer.from([0xC3, 0xB3]), to: 'ó' },
  { from: Buffer.from([0xC3, 0xA1]), to: 'á' },
  { from: Buffer.from([0xC3, 0xA9]), to: 'é' },
  { from: Buffer.from([0xC3, 0xAD]), to: 'í' },
  { from: Buffer.from([0xC3, 0xBA]), to: 'ú' },
  { from: Buffer.from([0xC2, 0xBF]), to: '¿' },
  { from: Buffer.from([0xC2, 0xA1]), to: '¡' },
  { from: Buffer.from([0xC3, 0x91]), to: 'Ñ' },
  { from: Buffer.from([0xC3, 0x93]), to: 'Ó' },
  { from: Buffer.from([0xC3, 0x81]), to: 'Á' }
];

function cleanFile(filePath) {
  let buffer = fs.readFileSync(filePath);
  let changed = false;
  
  for (const rep of replacements) {
    let index;
    while ((index = buffer.indexOf(rep.from)) !== -1) {
      const targetBuffer = Buffer.from(rep.to, 'utf8');
      buffer = Buffer.concat([
        buffer.slice(0, index),
        targetBuffer,
        buffer.slice(index + rep.from.length)
      ]);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Fixed binary encoding: ${path.relative(ROOT, filePath)}`);
  }
}

const publicDir = path.join(ROOT, 'public');
const jsDir = path.join(publicDir, 'js');

if (fs.existsSync(publicDir)) {
  const indexHtml = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexHtml)) cleanFile(indexHtml);
  
  if (fs.existsSync(jsDir)) {
    fs.readdirSync(jsDir).forEach(file => {
      if (file.endsWith('.js')) cleanFile(path.join(jsDir, file));
    });
  }
}

console.log('✨ Cleanup complete.');
