import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Diccionario de fallos binarios (UTF-8 bytes mal interpretados)
const reps = [
  // Emojis (Corrupciones comunes detectadas en hex)
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xc5, 0xa1, 0xe2, 0x82, 0xac]), to: '🚀' }, // Rocket
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0x8c, 0x8e]), to: '🌍' }, // Earth
  { from: Buffer.from([0xc3, 0xa2, 0xc2, 0xad, 0xc2, 0x90]), to: '⭐' }, // Star
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xc2, 0xa4, 0xe2, 0x80, 0x93]), to: '🤖' }, // Robot face
  { from: Buffer.from([0xc3, 0xa2, 0xc5, 0xa1, 0xc2, 0xa1]), to: '⚡' }, // Lightning
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x9d, 0xc2, 0x8d]), to: '🔍' }, // Search
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xc2, 0xa4, 0xe2, 0x80, 0x9d]), to: '🤔' }, // Thinking
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xc2, 0x93, 0x9d]), to: '📝' }, // Memo
  
  // Acentos dobles
  { from: Buffer.from([0xc3, 0x83, 0xc2, 0xb1]), to: 'ñ' },
  { from: Buffer.from([0xc3, 0x83, 0xc2, 0xb3]), to: 'ó' },
  { from: Buffer.from([0xc3, 0x83, 0xc2, 0xa1]), to: 'á' },
  { from: Buffer.from([0xc3, 0x83, 0xc2, 0xad]), to: 'í' },
  { from: Buffer.from([0xc3, 0x83, 0xc2, 0xa9]), to: 'é' },
  { from: Buffer.from([0xc3, 0x83, 0xc2, 0xba]), to: 'ú' },
  { from: Buffer.from([0xc3, 0x82, 0xc2, 0xbf]), to: '¿' },
  { from: Buffer.from([0xc3, 0x82, 0xc2, 0xa1]), to: '¡' }
];

function forceUTF8(filePath) {
  let buf = fs.readFileSync(filePath);
  let changed = false;

  // Reemplazo atómico por secuencia de bytes
  for (const r of reps) {
    let i;
    while ((i = buf.indexOf(r.from)) !== -1) {
      const target = Buffer.from(r.to, 'utf8');
      buf = Buffer.concat([buf.slice(0, i), target, buf.slice(i + r.from.length)]);
      changed = true;
    }
  }

  // Si es index.html, asegurar meta charset al principio y BOM
  if (filePath.endsWith('index.html')) {
    let content = buf.toString('utf8');
    if (content.includes('<meta charset="UTF-8">')) {
      content = content.replace('<meta charset="UTF-8">', '');
      content = '<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">' + content.replace('<!DOCTYPE html>\n<html lang="es">\n<head>', '');
      buf = Buffer.from(content, 'utf8');
      changed = true;
    }
    // Añadir BOM (EF BB BF)
    const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
    if (buf.slice(0, 3).compare(BOM) !== 0) {
      buf = Buffer.concat([BOM, buf]);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, buf);
    console.log(`✨ MASTER FIX: ${path.relative(ROOT, filePath)}`);
  }
}

const publicDir = path.join(ROOT, 'public');
const jsDir = path.join(publicDir, 'js');

if (fs.existsSync(publicDir)) {
  const indexHtml = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexHtml)) forceUTF8(indexHtml);
  
  if (fs.existsSync(jsDir)) {
    fs.readdirSync(jsDir).forEach(file => {
      if (file.endsWith('.js')) forceUTF8(path.join(jsDir, file));
    });
  }
}

console.log('✅ El sistema ha sido desinfectado de caracteres corruptos.');
