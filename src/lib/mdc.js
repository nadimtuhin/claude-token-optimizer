export function parseFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  if (lines[0] !== '---') return { frontmatter: null, body: content };

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') { endIndex = i; break; }
  }

  if (endIndex === -1) return { frontmatter: null, body: content };

  return {
    frontmatter: lines.slice(1, endIndex).join('\n'),
    body: lines.slice(endIndex + 1).join('\n'),
  };
}

export function serializeFrontmatter(frontmatter, body) {
  if (frontmatter === null) return body;
  return `---\n${frontmatter}\n---\n${body}`;
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatterFields(frontmatter) {
  const fields = {};
  let currentKey = null;

  for (const line of frontmatter.split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue;

    const listMatch = line.match(/^\s+-\s+(.+)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(fields[currentKey])) fields[currentKey] = [];
      fields[currentKey].push(stripQuotes(listMatch[1]));
      continue;
    }

    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();
      fields[currentKey] = value === '' ? null : stripQuotes(value);
    }
  }

  return fields;
}

export function classifyRule(content) {
  const { frontmatter } = parseFrontmatter(content);
  if (!frontmatter) return { policy: 'manual', description: null, globs: [] };

  const fields = parseFrontmatterFields(frontmatter);

  const alwaysOn = fields.alwaysApply === 'true' || fields.alwaysApply === true;

  let globs = [];
  if (Array.isArray(fields.globs)) {
    globs = fields.globs.filter(Boolean);
  } else if (typeof fields.globs === 'string' && fields.globs.trim() && fields.globs.trim() !== '[]') {
    globs = [fields.globs.trim()];
  }

  const hasDescription = typeof fields.description === 'string' && fields.description.trim().length > 0;

  const policy = alwaysOn ? 'always'
    : globs.length > 0 ? 'scoped'
    : hasDescription ? 'agent'
    : 'manual';

  return { policy, description: fields.description || null, globs };
}
