import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

interface ZipMetadata {
  lastZipSignature?: string;
  extractedAt?: string;
  activeZipName?: string;
}

export interface ZipFileOption {
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
  isActive: boolean;
}

export class ZipManager {
  private readonly repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../');
  private readonly dataDir = join(this.repoRoot, 'data', 'project-index');
  private readonly extractedDir = join(this.dataDir, 'extracted-project');
  private readonly metadataPath = join(this.dataDir, 'zip-metadata.json');

  getZipPath(): string {
    const options = this.readZipOptions();
    if (options.length === 0) {
      return join(this.repoRoot, 'project-source.zip');
    }

    const metadata = this.readMetadata();
    const preferred = metadata?.activeZipName
      ? options.find((option) => option.name === metadata.activeZipName)
      : undefined;

    return preferred?.path ?? options[0].path;
  }

  listZipFiles(): ZipFileOption[] {
    const metadata = this.readMetadata();
    const activeName = metadata?.activeZipName;
    const options = this.readZipOptions();
    const fallbackActiveName = options[0]?.name;

    return options.map((option) => ({
      ...option,
      isActive: option.name === activeName || (!activeName && option.name === fallbackActiveName)
    }));
  }

  setActiveZip(zipFileName: string): string {
    const options = this.readZipOptions();
    const selected = options.find((option) => option.name === zipFileName);
    if (!selected) {
      throw new Error(`Zip file not found: ${zipFileName}`);
    }

    const current = this.readMetadata() ?? {};
    this.writeMetadata({
      ...current,
      activeZipName: selected.name
    });

    return selected.path;
  }

  getActiveZipName(): string | null {
    const metadata = this.readMetadata();
    const options = this.readZipOptions();
    if (options.length === 0) {
      return null;
    }

    if (metadata?.activeZipName && options.some((option) => option.name === metadata.activeZipName)) {
      return metadata.activeZipName;
    }

    return options[0].name;
  }

  private readZipOptions(): Array<Omit<ZipFileOption, 'isActive'>> {
    const entries = readdirSync(this.repoRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.zip'))
      .map((entry) => {
        const fullPath = join(this.repoRoot, entry.name);
        const stat = statSync(fullPath);
        return {
          name: entry.name,
          path: fullPath,
          sizeBytes: stat.size,
          modifiedAt: new Date(stat.mtimeMs).toISOString()
        };
      })
      .sort((a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt));

    return entries;
  }

  getExtractedRoot(): string {
    return this.extractedDir;
  }

  ensureExtracted(force = false): { changed: boolean; zipSignature: string; zipPath: string } {
    const zipPath = this.getZipPath();
    if (!existsSync(zipPath)) {
      throw new Error(`Project zip not found. Put a .zip file at repository root. Last expected path: ${zipPath}`);
    }

    mkdirSync(this.dataDir, { recursive: true });

    const stat = statSync(zipPath);
    const zipSignature = `${stat.size}:${Math.floor(stat.mtimeMs)}`;
    const previous = this.readMetadata();
    const changed = force || !previous || previous.lastZipSignature !== zipSignature || !existsSync(this.extractedDir);

    if (changed) {
      rmSync(this.extractedDir, { recursive: true, force: true });
      mkdirSync(this.extractedDir, { recursive: true });

      const zip = new AdmZip(zipPath);
      zip.extractAllTo(this.extractedDir, true);

      this.writeMetadata({
        ...previous,
        lastZipSignature: zipSignature,
        extractedAt: new Date().toISOString(),
        activeZipName: this.getActiveZipName() ?? undefined
      });
    }

    return { changed, zipSignature, zipPath };
  }

  private readMetadata(): ZipMetadata | null {
    if (!existsSync(this.metadataPath)) {
      return null;
    }

    try {
      const raw = readFileSync(this.metadataPath, 'utf8');
      return JSON.parse(raw) as ZipMetadata;
    } catch {
      return null;
    }
  }

  private writeMetadata(metadata: ZipMetadata): void {
    writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
  }
}

export const zipManager = new ZipManager();
