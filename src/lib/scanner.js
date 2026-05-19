import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';

const AUTO_LOAD_PATTERNS = [
  '*.md',
  '.claude/*.md',
  'docs/**/*.md',
];

function readIgnorePatterns(dir) {
  const ignorePath = path.join(dir, '.claudeignore');
  if (!fs.existsSync(ignorePath)) return [];
  return fs.readFileSync(ignorePath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

export async function scanAutoLoadFiles(dir) {
  const ignorePatterns = readIgnorePatterns(dir);

  const files = await glob(AUTO_LOAD_PATTERNS, {
    cwd: dir,
    absolute: true,
    ignore: ignorePatterns,
    dot: true,
  });

  const results = [];
  for (const filePath of files) {
    try {
      results.push({ path: filePath, content: fs.readFileSync(filePath, 'utf8') });
    } catch {
      // skip unreadable files
    }
  }
  return results;
}
