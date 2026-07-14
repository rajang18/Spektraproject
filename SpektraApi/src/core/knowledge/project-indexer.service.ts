import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { embeddingService } from './embedding.service.js';
import { ProjectChunk, ProjectFileMetadata, ProjectIndexData } from './project-knowledge.types.js';
import { zipManager } from './zip-manager.service.js';

const INCLUDED_EXTENSIONS = new Set([
  '.ts',
  '.html',
  '.scss',
  '.css',
  '.json',
  '.md',
  '.txt',
  '.yaml',
  '.yml'
]);

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git']);

const CHUNK_SIZE = 80;
const CHUNK_OVERLAP = 12;

function uniq(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function firstMatch(content: string, regex: RegExp): string | undefined {
  const match = content.match(regex);
  return match?.[1]?.trim();
}

export class ProjectIndexer {
  private readonly repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../');
  private readonly indexDir = join(this.repoRoot, 'data', 'project-index');
  private readonly indexPath = join(this.indexDir, 'project-index.json');

  getIndexPath(): string {
    return this.indexPath;
  }

  getRepoRoot(): string {
    return this.repoRoot;
  }

  ensureIndexed(): ProjectIndexData {
    const extraction = zipManager.ensureExtracted(false);

    if (!existsSync(this.indexPath) || extraction.changed) {
      return this.reindex(false);
    }

    const current = this.readIndex();
    if (!current || current.zipSignature !== extraction.zipSignature) {
      return this.reindex(false);
    }

    return current;
  }

  reindex(forceZipRefresh: boolean): ProjectIndexData {
    const extraction = zipManager.ensureExtracted(forceZipRefresh);
    const sourceRoot = this.resolveSourceRoot(zipManager.getExtractedRoot());
    const files = this.collectFiles(sourceRoot);
    const metadataList: ProjectFileMetadata[] = [];
    const chunks: ProjectChunk[] = [];

    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf8');
      const relativePath = relative(this.repoRoot, filePath).replaceAll('\\', '/');
      const fileMetadata = this.extractMetadata(relativePath, content);
      metadataList.push(fileMetadata);

      const lines = content.split(/\r?\n/);
      let chunkIndex = 0;
      for (let start = 0; start < lines.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
        const end = Math.min(lines.length, start + CHUNK_SIZE);
        const chunkLines = lines.slice(start, end);
        if (chunkLines.length === 0) {
          continue;
        }

        const chunkContent = chunkLines.join('\n');
        const tokenHints = (chunkContent.toLowerCase().match(/[a-z0-9_/-]{3,}/g) ?? []).slice(0, 25);
        chunks.push({
          id: `${relativePath}#${chunkIndex}`,
          relativePath,
          startLine: start + 1,
          endLine: end,
          content: chunkContent,
          embedding: embeddingService.embed(`${relativePath}\n${chunkContent}`),
          tokenHints: uniq(tokenHints),
          metadata: fileMetadata
        });

        chunkIndex += 1;
        if (end >= lines.length) {
          break;
        }
      }
    }

    const index: ProjectIndexData = {
      projectName: this.deriveProjectName(extraction.zipPath),
      sourceRoot: sourceRoot.replaceAll('\\', '/'),
      zipSignature: extraction.zipSignature,
      indexedAt: new Date().toISOString(),
      files: metadataList,
      chunks
    };

    mkdirSync(this.indexDir, { recursive: true });
    writeFileSync(this.indexPath, JSON.stringify(index));

    return index;
  }

  readIndex(): ProjectIndexData | null {
    if (!existsSync(this.indexPath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(this.indexPath, 'utf8')) as ProjectIndexData;
    } catch {
      return null;
    }
  }

  private resolveSourceRoot(extractedRoot: string): string {
    const candidates = [
      join(extractedRoot, '_main_src', 'src'),
      join(extractedRoot, 'src'),
      join(extractedRoot, '_main_src')
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate) && statSync(candidate).isDirectory()) {
        return candidate;
      }
    }

    return extractedRoot;
  }

  private collectFiles(rootDir: string): string[] {
    const files: string[] = [];
    const stack = [rootDir];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }

      const entries = readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(current, entry.name);
        if (entry.isDirectory()) {
          if (!EXCLUDED_DIRS.has(entry.name)) {
            stack.push(fullPath);
          }
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        const ext = extname(entry.name).toLowerCase();
        if (INCLUDED_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  private deriveProjectName(zipPath: string): string {
    const base = basename(zipPath, extname(zipPath));
    return base
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (ch) => ch.toUpperCase()) || 'Indexed Project';
  }

  private extractMetadata(relativePath: string, content: string): ProjectFileMetadata {
    const extension = extname(relativePath).toLowerCase();
    const fileName = relativePath.split('/').pop() ?? relativePath;
    const folder = dirname(relativePath).replaceAll('\\', '/');

    const classNames = uniq((content.match(/\bclass\s+([A-Za-z0-9_]+)/g) ?? []).map((x) => x.split(/\s+/).pop() ?? ''));
    const functions = uniq((content.match(/\bfunction\s+([A-Za-z0-9_]+)/g) ?? []).map((x) => x.split(/\s+/).pop() ?? ''));
    const methods = uniq((content.match(/\b([A-Za-z0-9_]+)\s*\([^)]*\)\s*:\s*[A-Za-z0-9_<>{}\[\]| ]+\s*\{/g) ?? []).map((x) => x.split('(')[0].trim()));
    const imports = uniq((content.match(/from\s+['\"]([^'\"]+)['\"]/g) ?? []).map((x) => x.replace(/from\s+['\"]|['\"]/g, '').trim()));
    const exports = uniq((content.match(/\bexport\s+(?:class|const|function|interface|type)\s+([A-Za-z0-9_]+)/g) ?? []).map((x) => x.split(/\s+/).pop() ?? ''));
    const interfaces = uniq((content.match(/\binterface\s+([A-Za-z0-9_]+)/g) ?? []).map((x) => x.split(/\s+/).pop() ?? ''));
    const servicesUsed = uniq((content.match(/\b([A-Za-z0-9_]+Service)\b/g) ?? []).map((x) => x.trim()));
    const apiUrls = uniq(content.match(/\/api\/[a-z0-9_/-]+/gi) ?? []);
    const routePaths = uniq((content.match(/path\s*:\s*['\"]([^'\"]+)['\"]/g) ?? []).map((x) => x.replace(/.*['\"]([^'\"]+)['\"].*/, '$1')));

    const selector = firstMatch(content, /selector\s*:\s*['\"]([^'\"]+)['\"]/);
    const componentName = firstMatch(content, /export\s+class\s+([A-Za-z0-9_]+Component)\b/);
    const moduleName = firstMatch(content, /export\s+class\s+([A-Za-z0-9_]+Module)\b/);

    const summaryParts: string[] = [];
    if (componentName) {
      summaryParts.push(`Component ${componentName}`);
    }
    if (moduleName) {
      summaryParts.push(`Module ${moduleName}`);
    }
    if (selector) {
      summaryParts.push(`selector ${selector}`);
    }
    if (servicesUsed.length > 0) {
      summaryParts.push(`uses ${servicesUsed.slice(0, 4).join(', ')}`);
    }

    return {
      fileName,
      relativePath,
      extension,
      folder,
      componentName,
      moduleName,
      classNames,
      functions,
      methods,
      imports,
      exports,
      interfaces,
      servicesUsed,
      apiUrls,
      routePaths,
      angularSelector: selector,
      featureSummary: summaryParts.join(' | ') || `File ${fileName}`
    };
  }
}

export const projectIndexer = new ProjectIndexer();
