import { extractJsonArray, extractJsonObject, cleanMarkdown, estimateTokenCount } from './parser';
import {
  buildStubPrompt,
  buildTocPrompt,
  buildPagePrompt,
  buildSearchPrompt,
  buildRewritePrompt,
} from './prompts';
import { useSettingsStore } from '@/stores/settingsStore';
import { decryptApiKey } from '@/lib/utils/crypto';
import type { BookStub, BookTheme, PageContent, TocEntry, HallId } from '@/types';
import { uuidWithPrefix } from '@/lib/utils/id';
import { getTheme } from '@/data/themes';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export class AIService {
  private async getApiKey(): Promise<string> {
    const enc = useSettingsStore.getState().api.apiKeyEncrypted;
    if (!enc) return '';
    return decryptApiKey(enc);
  }

  private async getConfig() {
    const s = useSettingsStore.getState().api;
    const key = await this.getApiKey();
    return { baseUrl: s.baseUrl, apiKey: key, model: s.model, temperature: s.temperature, stream: s.streamEnabled };
  }

  /**
   * 通用 chat 调用
   */
  async chat(messages: ChatMessage[], opts: CompletionOptions = {}): Promise<string> {
    const cfg = await this.getConfig();
    if (!cfg.apiKey) throw new Error('NO_API_KEY');

    const url = `${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const body = {
      model: cfg.model,
      messages,
      temperature: opts.temperature ?? cfg.temperature,
      max_tokens: opts.maxTokens ?? 2048,
      stream: opts.stream ?? cfg.stream,
    };

    if (body.stream && opts.onToken) {
      const full = await this.streamChat(url, cfg.apiKey, body, opts.onToken, opts.signal);
      return full;
    } else {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({ ...body, stream: false }),
        signal: opts.signal,
      });
      if (!res.ok) {
        throw new Error(`API_ERROR_${res.status}: ${await res.text().catch(() => '')}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? '';
    }
  }

  private async streamChat(
    url: string,
    apiKey: string,
    body: any,
    onToken: (t: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`API_ERROR_${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const obj = JSON.parse(data);
          const delta = obj.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            full += delta;
            onToken(delta);
          }
        } catch {/* skip */}
      }
    }
    return full;
  }

  // ==========================================================================
  // 业务方法
  // ==========================================================================

  async generateStubs(args: {
    hallId: HallId;
    hallName: string;
    hallTheme: string;
    count: number;
    existingTitles?: string[];
    signal?: AbortSignal;
  }): Promise<BookStub[]> {
    const { system, user } = buildStubPrompt(args);
    let fullText = '';
    const raw = await this.chat(
      [{ role: 'system', content: system }, { role: 'user', content: user }],
      { maxTokens: 1500, signal: args.signal, onToken: (t) => (fullText += t) },
    );
    const arr = extractJsonArray<{
      title: string;
      author: string;
      introduction: string;
      category: string;
      theme: BookTheme;
    }>(raw || fullText);
    return arr.map((item, i) => this.toStub(item, args.hallId, i, args.existingTitles));
  }

  async generateToc(args: {
    title: string;
    author: string;
    introduction: string;
    category: string;
    theme: BookTheme;
    totalPages?: number;
    signal?: AbortSignal;
  }): Promise<{ toc: TocEntry[]; totalPages: number }> {
    const { system, user } = buildTocPrompt(args);
    const raw = await this.chat(
      [{ role: 'system', content: system }, { role: 'user', content: user }],
      { maxTokens: 1500, signal: args.signal },
    );
    const arr = extractJsonArray<TocEntry>(raw);
    const total = args.totalPages ?? 80;
    // 规整化 startPage
    const toc: TocEntry[] = arr.map((entry, i) => ({
      index: entry.index ?? i + 1,
      title: entry.title ?? `第${i + 1}章`,
      startPage: entry.startPage ?? Math.floor((total * i) / arr.length) + 1,
    }));
    return { toc, totalPages: total };
  }

  async generateTocPage(args: {
    title: string;
    author: string;
    toc: TocEntry[];
    signal?: AbortSignal;
    onToken?: (t: string) => void;
  }): Promise<string> {
    const { system, user } = buildPagePrompt({
      title: args.title,
      author: args.author,
      category: '目录',
      theme: 'general',
      introduction: '',
      toc: args.toc,
      pageNumber: 0,
      isTocPage: true,
    });
    let acc = '';
    const raw = await this.chat(
      [{ role: 'system', content: system }, { role: 'user', content: user }],
      { maxTokens: 600, signal: args.signal, onToken: (t) => { acc += t; args.onToken?.(t); } },
    );
    return cleanMarkdown(raw || acc);
  }

  async generatePage(args: {
    bookId: string;
    title: string;
    author: string;
    category: string;
    theme: BookTheme;
    introduction: string;
    toc: TocEntry[];
    pageNumber: number;
    previousPagesSummary?: string;
    isFirstPage?: boolean;
    signal?: AbortSignal;
    onToken?: (t: string) => void;
  }): Promise<PageContent> {
    const { system, user } = buildPagePrompt(args);
    let acc = '';
    const raw = await this.chat(
      [{ role: 'system', content: system }, { role: 'user', content: user }],
      {
        maxTokens: 1200,
        signal: args.signal,
        onToken: (t) => { acc += t; args.onToken?.(t); },
      },
    );
    const markdown = cleanMarkdown(raw || acc);
    return {
      pageNumber: args.pageNumber,
      markdown,
      generatedAt: Date.now(),
      tokenCount: estimateTokenCount(markdown),
    };
  }

  async searchAndGenerate(args: {
    query: string;
    hallId: HallId;
    hallName: string;
    existingTitles?: string[];
    signal?: AbortSignal;
  }): Promise<BookStub[]> {
    const { system, user } = buildSearchPrompt(args);
    const raw = await this.chat(
      [{ role: 'system', content: system }, { role: 'user', content: user }],
      { maxTokens: 1200, signal: args.signal },
    );
    const arr = extractJsonArray<{
      title: string;
      author: string;
      introduction: string;
      category: string;
      theme: BookTheme;
    }>(raw);
    return arr.map((item, i) => this.toStub(item, args.hallId, i, args.existingTitles));
  }

  async rewriteField(args: {
    field: 'introduction' | 'toc' | 'category' | 'title';
    current: string;
    userRequest: string;
    context: { title: string; author: string; category: string; theme: BookTheme };
    signal?: AbortSignal;
  }): Promise<string | TocEntry[] | null> {
    const { system, user } = buildRewritePrompt(args);
    const raw = await this.chat(
      [{ role: 'system', content: system }, { role: 'user', content: user }],
      { maxTokens: 1000, signal: args.signal },
    );
    if (args.field === 'toc') {
      return extractJsonArray<TocEntry>(raw);
    }
    return cleanMarkdown(raw);
  }

  // ==========================================================================
  // 私有：Stub 工厂
  // ==========================================================================
  private toStub(
    item: { title: string; author: string; introduction: string; category: string; theme: BookTheme },
    hallId: HallId,
    index: number,
    existingTitles?: string[],
  ): BookStub {
    const themeInfo = getTheme(item.theme);
    const seed = (item.title.length * 31 + item.title.charCodeAt(0) * 17 + index * 13) >>> 0;
    return {
      id: uuidWithPrefix('bk'),
      title: item.title || `未命名之书 ${index + 1}`,
      author: item.author || '佚名',
      introduction: item.introduction || '此书内容残缺，封面亦已斑驳。',
      coverColor: themeInfo.defaultColor,
      coverTextureSeed: seed,
      coverMaterial: this.pickMaterial(seed),
      thickness: 0.04 + (seed % 10) / 200,
      height: 0.25 + ((seed >> 4) % 12) / 100,
      width: 0.16 + ((seed >> 8) % 8) / 100,
      category: item.category || themeInfo.zh,
      theme: item.theme || 'general',
      location: { hallId, shelfId: '', slotIndex: 0 },
      pulseColor: themeInfo.defaultPulseColor,
      generatedAt: Date.now(),
      isUserEdited: false,
    };
  }

  private pickMaterial(seed: number): 'leather' | 'cloth' | 'metal' | 'crystal' | 'paper' {
    const arr = ['leather', 'cloth', 'metal', 'crystal', 'paper'] as const;
    return arr[seed % arr.length];
  }
}

export const aiService = new AIService();
