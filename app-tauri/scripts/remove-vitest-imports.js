import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function removeVitestImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const newLines = lines.filter(line => !line.includes('import') || !line.includes('vitest'));
  fs.writeFileSync(filePath, newLines.join('\n'));
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
      removeVitestImports(filePath);
    }
  });
}

processDirectory(path.join(__dirname, '../src')); 