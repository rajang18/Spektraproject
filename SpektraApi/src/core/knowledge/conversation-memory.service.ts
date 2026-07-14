import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ChatTurn, ConversationHistory, ConversationSummary } from './project-knowledge.types.js';

const MAX_TURNS = 30;

type ConversationStore = Record<string, ChatTurn[]>;

export class ConversationMemory {
  private readonly repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../');
  private readonly dataDir = join(this.repoRoot, 'data', 'project-index');
  private readonly memoryPath = join(this.dataDir, 'chat-memory.json');
  private memory: ConversationStore = {};
  private initialized = false;

  getHistory(conversationId: string): ChatTurn[] {
    this.ensureInitialized();
    return this.memory[conversationId] ?? [];
  }

  append(conversationId: string, turn: ChatTurn): void {
    this.ensureInitialized();
    const current = this.memory[conversationId] ?? [];
    const next = [...current, turn].slice(-MAX_TURNS);
    this.memory[conversationId] = next;
    this.persist();
  }

  summarizeForPrompt(conversationId: string): string {
    const turns = this.getHistory(conversationId);
    if (turns.length === 0) {
      return 'No prior conversation context.';
    }

    return turns
      .slice(-6)
      .map((turn, index) => `${index + 1}. Q: ${turn.question}\nA: ${turn.answer.slice(0, 500)}`)
      .join('\n\n');
  }

  listConversations(limit = 50): ConversationSummary[] {
    this.ensureInitialized();

    return Object.entries(this.memory)
      .filter(([, turns]) => turns.length > 0)
      .map(([conversationId, turns]) => {
        const sortedTurns = [...turns].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const lastTurn = sortedTurns[sortedTurns.length - 1];

        return {
          conversationId,
          turnCount: turns.length,
          lastMessageAt: lastTurn.timestamp,
          preview: lastTurn.question.slice(0, 140)
        };
      })
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .slice(0, limit);
  }

  getConversation(conversationId: string): ConversationHistory {
    this.ensureInitialized();

    const turns = [...(this.memory[conversationId] ?? [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return {
      conversationId,
      turnCount: turns.length,
      turns
    };
  }

  private ensureInitialized(): void {
    if (this.initialized) {
      return;
    }

    mkdirSync(this.dataDir, { recursive: true });

    if (existsSync(this.memoryPath)) {
      try {
        const raw = readFileSync(this.memoryPath, 'utf8');
        this.memory = JSON.parse(raw) as ConversationStore;
      } catch {
        this.memory = {};
      }
    }

    this.initialized = true;
  }

  private persist(): void {
    writeFileSync(this.memoryPath, JSON.stringify(this.memory));
  }
}

export const conversationMemory = new ConversationMemory();
