const VECTOR_SIZE = 256;

function tokenize(input: string): string[] {
  return (input.toLowerCase().match(/[a-z0-9_/-]{2,}/g) ?? []).slice(0, 2500);
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export class EmbeddingService {
  embed(text: string): number[] {
    const tokens = tokenize(text);
    const vector = new Array<number>(VECTOR_SIZE).fill(0);

    for (const token of tokens) {
      const index = hashToken(token) % VECTOR_SIZE;
      vector[index] += 1;
    }

    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (norm === 0) {
      return vector;
    }

    return vector.map((value) => value / norm);
  }

  similarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) {
      return 0;
    }

    let dot = 0;
    for (let i = 0; i < a.length; i += 1) {
      dot += a[i] * b[i];
    }

    return dot;
  }
}

export const embeddingService = new EmbeddingService();
