import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import { getDefaultTarget } from './targets.js';

function readIgnorePatterns(dir, ignoreFile) {
  const ignorePath = path.join(dir, ignoreFile);
  if (!fs.existsSync(ignorePath)) return [];
  return fs.readFileSync(ignorePath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

const MAX_SCAN_BYTES = 1_000_000;

export async function scanAutoLoadFiles(dir, target = getDefaultTarget()) {
  const ignorePatterns = readIgnorePatterns(dir, target.ignoreFile);

  const files = await glob(target.scanPatterns, {
    cwd: dir,
    absolute: true,
    ignore: ignorePatterns,
    dot: true,
  });

  const seen = new Set();
  const results = [];
  for (const filePath of files) {
    const resolved = path.resolve(filePath);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    try {
      const stat = fs.statSync(resolved);
      if (stat.size > MAX_SCAN_BYTES) continue;
      results.push({ path: resolved, content: fs.readFileSync(resolved, 'utf8') });
    } catch {
    }
  }
  return results;
}
