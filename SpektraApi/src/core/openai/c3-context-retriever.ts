import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface SourceDoc {
  path: string;
  lines: string[];
  contentLower: string;
}

const ALLOWED_EXTENSIONS = new Set(['.ts', '.html', '.scss', '.json']);
const STOP_WORDS = new Set([
  'the',
  'this',
  'that',
  'with',
  'from',
  'have',
  'what',
  'where',
  'which',
  'about',
  'into',
  'your',
  'there',
  'how',
  'when',
  'will',
  'would',
  'could',
  'should',
  'project',
  'c3',
  'code',
  'file',
  'files',
  'give',
  'all',
  'info',
  'details'
]);

let cachedDocs: SourceDoc[] | null = null;
let cachedModules: string[] | null = null;

function getRepoRoot(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFilePath);
  return resolve(currentDir, '../../../../');
}

function getC3AppRoot(): string {
  return join(getRepoRoot(), '_main_src', 'src');
}

function collectFiles(rootDir: string): string[] {
  const files: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const lower = entry.name.toLowerCase();
      const dot = lower.lastIndexOf('.');
      const ext = dot >= 0 ? lower.slice(dot) : '';
      if (ALLOWED_EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function loadDocs(): SourceDoc[] {
  if (cachedDocs) {
    return cachedDocs;
  }

  const appRoot = getC3AppRoot();
  if (!existsSync(appRoot)) {
    cachedDocs = [];
    cachedModules = [];
    return cachedDocs;
  }

  const repoRoot = getRepoRoot();
  const files = collectFiles(appRoot);
  cachedDocs = files.map((filePath) => {
    const text = readFileSync(filePath, 'utf8');
    return {
      path: relative(repoRoot, filePath).replaceAll('\\', '/'),
      lines: text.split(/\r?\n/),
      contentLower: text.toLowerCase()
    };
  });

  const moduleNames = new Set<string>();
  for (const doc of cachedDocs) {
    const marker = 'src/app/modules/';
    const index = doc.path.indexOf(marker);
    if (index >= 0) {
      const remain = doc.path.slice(index + marker.length);
      const first = remain.split('/')[0];
      if (first) {
        moduleNames.add(first);
      }
    }
  }
  cachedModules = [...moduleNames].sort((a, b) => a.localeCompare(b));

  return cachedDocs;
}

function extractTerms(query: string): string[] {
  const tokens = (query.toLowerCase().match(/[a-z0-9_-]{3,}/g) ?? []).filter(
    (token) => !STOP_WORDS.has(token)
  );

  const unique = new Set(tokens);
  return [...unique].slice(0, 14);
}

function scoreDoc(doc: SourceDoc, terms: string[]): number {
  let score = 0;
  for (const term of terms) {
    if (doc.path.toLowerCase().includes(term)) {
      score += 6;
    }

    let from = 0;
    while (true) {
      const idx = doc.contentLower.indexOf(term, from);
      if (idx < 0) {
        break;
      }
      score += 1;
      from = idx + term.length;
      if (score > 120) {
        break;
      }
    }
  }

  return score;
}

function snippetForDoc(doc: SourceDoc, terms: string[]): string {
  const hitLineIndexes = new Set<number>();

  for (const term of terms) {
    const termLower = term.toLowerCase();
    for (let i = 0; i < doc.lines.length; i += 1) {
      if (doc.lines[i].toLowerCase().includes(termLower)) {
        hitLineIndexes.add(i);
        if (hitLineIndexes.size >= 4) {
          break;
        }
      }
    }
    if (hitLineIndexes.size >= 4) {
      break;
    }
  }

  const sorted = [...hitLineIndexes].sort((a, b) => a - b).slice(0, 4);
  if (sorted.length === 0) {
    return doc.lines.slice(0, 6).join('\n');
  }

  const parts: string[] = [];
  for (const lineIndex of sorted) {
    const start = Math.max(0, lineIndex - 1);
    const end = Math.min(doc.lines.length - 1, lineIndex + 1);
    for (let i = start; i <= end; i += 1) {
      parts.push(`${i + 1}: ${doc.lines[i]}`);
    }
    parts.push('...');
  }

  return parts.join('\n');
}

function projectInventoryLine(docs: SourceDoc[]): string {
  const guardCount = docs.filter((d) => d.path.includes('guard')).length;
  const serviceCount = docs.filter((d) => d.path.includes('/services/') && d.path.endsWith('.ts')).length;
  const moduleCount = cachedModules?.length ?? 0;
  return `Inventory: ${docs.length} source files indexed, ${moduleCount} top-level modules, ${serviceCount} services, ${guardCount} guard-related files.`;
}

/**
 * Build dynamic source context for the current user prompt so the model can
 * answer from actual C3 files instead of generic patterns.
 */
export function buildDynamicC3Context(userPrompt: string): string {
  const docs = loadDocs();
  if (docs.length === 0) {
    return 'DYNAMIC C3 SOURCE MATCHES: source folder _main_src/src/app is missing.';
  }

  const terms = extractTerms(userPrompt);
  if (terms.length === 0) {
    const modules = (cachedModules ?? []).slice(0, 25).join(', ');
    return [
      'DYNAMIC C3 SOURCE MATCHES',
      projectInventoryLine(docs),
      `Top modules: ${modules}`
    ].join('\n');
  }

  const ranked = docs
    .map((doc) => ({ doc, score: scoreDoc(doc, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const modules = (cachedModules ?? []).slice(0, 25).join(', ');
  const sections: string[] = [
    'DYNAMIC C3 SOURCE MATCHES',
    projectInventoryLine(docs),
    `Top modules: ${modules}`,
    `Query terms used for retrieval: ${terms.join(', ')}`
  ];

  if (ranked.length === 0) {
    sections.push('No lexical file matches found for this prompt. Use inventory + knowledge pack.');
  } else {
    for (const item of ranked) {
      sections.push(`FILE: ${item.doc.path} (score: ${item.score})`);
      sections.push(snippetForDoc(item.doc, terms));
    }
  }

  const text = sections.join('\n\n');
  return text.length > 18000 ? text.slice(0, 18000) : text;
}
