const FENCE = /^\s*(```|~~~)/;

// For each line, true if it is a code fence marker or sits inside a fenced block.
export function markFencedLines(lines) {
  let open = null;
  return lines.map((line) => {
    const m = line.match(FENCE);
    if (!m) return open !== null;
    if (open === null) open = m[1];
    else if (m[1] === open) open = null;
    return true;
  });
}
