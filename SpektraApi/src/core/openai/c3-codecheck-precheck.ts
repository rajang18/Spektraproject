import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Finding {
  file: string;
  line: number;
  type: 'html-text' | 'html-attr' | 'ts-literal';
  evidence: string;
}

const INCLUDED_EXTENSIONS = new Set(['.ts', '.html']);
const EXCLUDED_PATH_PARTS = [
  '/assets/i18n/',
  '/modules/i18n/',
  '/node_modules/',
  '.spec.ts'
];

const CODE_CHECK_INTENT_TERMS = [
  'hardcoded',
  'hard-coded',
  'i18n',
  'translation',
  'translate',
  'audit',
  'scan',
  'code check',
  'code quality',
  'static check',
  'string check'
];

function getRepoRoot(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFilePath);
  return resolve(currentDir, '../../../../');
}

function getC3SourceRoot(): string {
  return join(getRepoRoot(), '_main_src', 'src');
}

function shouldRunCodeCheck(requirement: string): boolean {
  const text = requirement.toLowerCase();
  return CODE_CHECK_INTENT_TERMS.some((term) => text.includes(term));
}

function collectCandidateFiles(rootDir: string): string[] {
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
      const normalized = fullPath.replaceAll('\\', '/').toLowerCase();
      if (EXCLUDED_PATH_PARTS.some((part) => normalized.includes(part))) {
        continue;
      }

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const fileName = entry.name.toLowerCase();
      const dot = fileName.lastIndexOf('.');
      const ext = dot >= 0 ? fileName.slice(dot) : '';
      if (!INCLUDED_EXTENSIONS.has(ext)) {
        continue;
      }

      files.push(fullPath);
    }
  }

  return files;
}

function trimEvidence(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 160);
}

function findHtmlTextLine(line: string): string | null {
  if (line.includes('translate') || line.includes('{{')) {
    return null;
  }

  const textNodeMatch = line.match(/>\s*([A-Za-z][^<{]{2,120})\s*</);
  if (textNodeMatch?.[1]) {
    return trimEvidence(textNodeMatch[1]);
  }

  const attrMatch = line.match(/(?:placeholder|title|aria-label)\s*=\s*['\"]([A-Za-z][^'\"]{2,120})['\"]/);
  if (attrMatch?.[1]) {
    return trimEvidence(attrMatch[1]);
  }

  return null;
}

function findTsLiteralLine(line: string): string | null {
  if (
    line.includes('TRANSLATE.') ||
    line.includes('translateService.instant') ||
    line.includes("translate.instant") ||
    line.includes("'./") ||
    line.includes('"./') ||
    line.includes('import ') ||
    line.includes(' from ')
  ) {
    return null;
  }

  if (!/(toast|swal|title\s*:|message\s*:|label\s*:|placeholder\s*:)/i.test(line)) {
    return null;
  }

  const literalMatch = line.match(/['\"]([A-Za-z][^'\"]{2,140})['\"]/);
  if (!literalMatch?.[1]) {
    return null;
  }

  return trimEvidence(literalMatch[1]);
}

function scanHardcodedStrings(rootDir: string): Finding[] {
  const repoRoot = getRepoRoot();
  const files = collectCandidateFiles(rootDir);
  const findings: Finding[] = [];

  for (const file of files) {
    const normalized = file.replaceAll('\\', '/').toLowerCase();
    const isHtml = normalized.endsWith('.html');
    const isTs = normalized.endsWith('.ts');

    const content = readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      let evidence: string | null = null;
      let type: Finding['type'] | null = null;

      if (isHtml) {
        const htmlEvidence = findHtmlTextLine(line);
        if (htmlEvidence) {
          evidence = htmlEvidence;
          type = /placeholder|title|aria-label/.test(line) ? 'html-attr' : 'html-text';
        }
      } else if (isTs) {
        const tsEvidence = findTsLiteralLine(line);
        if (tsEvidence) {
          evidence = tsEvidence;
          type = 'ts-literal';
        }
      }

      if (!evidence || !type) {
        continue;
      }

      findings.push({
        file: relative(repoRoot, file).replaceAll('\\', '/'),
        line: i + 1,
        type,
        evidence
      });

      if (findings.length >= 180) {
        return findings;
      }
    }
  }

  return findings;
}

function summarizeFindings(findings: Finding[]): string {
  if (!findings.length) {
    return 'Precheck result: no clear hardcoded user-facing strings were detected in scanned .html/.ts files (excluding i18n dictionaries).';
  }

  const filesMap = new Map<string, number>();
  for (const finding of findings) {
    filesMap.set(finding.file, (filesMap.get(finding.file) ?? 0) + 1);
  }

  const topFiles = [...filesMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([file, count]) => `- ${file}: ${count}`)
    .join('\n');

  const samples = findings
    .slice(0, 25)
    .map((finding) => `- ${finding.file}:${finding.line} [${finding.type}] ${finding.evidence}`)
    .join('\n');

  return [
    `Precheck result: ${findings.length} potential hardcoded-string findings detected.`,
    'Top files by count:',
    topFiles,
    'Sample findings:',
    samples
  ].join('\n');
}

export function buildC3CodeCheckPrecheck(requirement: string): string {
  if (!shouldRunCodeCheck(requirement)) {
    return '';
  }

  const sourceRoot = getC3SourceRoot();
  if (!existsSync(sourceRoot)) {
    return 'CODEBASE PRECHECK: _main_src/src not found, precheck skipped.';
  }

  const findings = scanHardcodedStrings(sourceRoot);
  return [
    'CODEBASE PRECHECK (deterministic scan over _main_src/src)',
    summarizeFindings(findings),
    'Instruction: prioritize these concrete file findings over generic assumptions.'
  ].join('\n\n');
}
