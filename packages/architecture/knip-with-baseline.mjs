// Corre knip en todo el monorepo y compara lo que encuentra con knip.baseline.txt (deuda que ya existía).
// Falla si aparece algo nuevo o si algo conocido ya se corrigió y sigue en la lista.
// Para regenerar la lista tras corregir: UPDATE_BASELINE=1 pnpm knip
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BASELINE = join(ROOT, 'knip.baseline.txt');
const HEADER = `# Hallazgos de knip que ya existían. \`pnpm knip\` falla si aparece uno nuevo o si uno de estos se corrige y sigue aquí.
# Para regenerar el archivo tras corregir: UPDATE_BASELINE=1 pnpm knip
`;

function runKnip() {
  try {
    return execFileSync('pnpm', ['exec', 'knip', '--no-progress', '--reporter', 'json'], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      // En Windows pnpm es un .cmd y necesita shell.
      shell: process.platform === 'win32',
    });
  } catch (error) {
    // knip sale con código 1 cuando encuentra algo; la salida JSON sigue siendo válida.
    if (error.stdout) return error.stdout;
    throw error;
  }
}

const findings = [];
for (const issue of JSON.parse(runKnip()).issues) {
  for (const [type, entries] of Object.entries(issue)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const name = Array.isArray(entry) ? entry.map((e) => e.name).join(' | ') : entry.name;
      findings.push(type === 'files' ? `files: ${issue.file}` : `${type}: ${issue.file}: ${name}`);
    }
  }
}
const current = [...new Set(findings)].sort();

if (process.env.UPDATE_BASELINE === '1') {
  writeFileSync(BASELINE, HEADER + current.map((f) => `${f}\n`).join(''));
}

const known = new Set(
  existsSync(BASELINE)
    ? readFileSync(BASELINE, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    : [],
);
const added = current.filter((f) => !known.has(f));
const fixed = [...known].filter((f) => !current.includes(f));

if (added.length > 0) console.error(`knip: ${added.length} hallazgos nuevos:\n  ${added.join('\n  ')}`);
if (fixed.length > 0) console.error(`knip: ${fixed.length} ya corregidos, bórralos de knip.baseline.txt:\n  ${fixed.join('\n  ')}`);
if (added.length > 0 || fixed.length > 0) process.exit(1);
console.log(`knip: sin hallazgos nuevos (${current.length} conocidos).`);
