import type { Detection, Thread } from '../types';

interface RawItem {
  thread_id: string;
  amount: number;
  text?: string;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

function systemPrompt(threads: Thread[]): string {
  const list = threads
    .map(
      (t) =>
        `- ${t.id} (${t.name}) · unit=${t.unit} · aliases: ${t.aliases.slice(0, 8).join(', ')}`,
    )
    .join('\n');
  return `You extract structured progress data from a person's daily journal.

Available threads:
${list}

Rules:
- Only emit contributions to threads that appear in the entry.
- For threads with unit=minutes, amount must be in minutes (an hour = 60, 1.5 hours = 90).
- For threads with unit=count, amount is a whole number of items done (leetcode problems, jobs applied, meals cooked). Default 1 when unspecified.
- If a thread is mentioned without an explicit amount, still emit it with a reasonable default.
- Never invent activities. If nothing matches, emit an empty list.
- Return JSON only: { "items": [{ "thread_id": "workout", "amount": 45, "text": "went to the gym for 45 min" }] }
- text should be the short clause from the entry that the contribution came from.`;
}

function getEnvKey(): string | undefined {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return env?.VITE_GROQ_API_KEY;
}

function getLocalStorageKey(): string | undefined {
  try {
    const stored = localStorage.getItem('groqApiKey');
    return stored ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * The parser is "configured" if we have a way to reach Groq — either a
 * server-side proxy at /api/groq (preferred) or a direct browser key
 * for local development.
 */
export function isConfigured(proxyUrl?: string): boolean {
  if (proxyUrl && proxyUrl.trim().length > 0) return true;
  const key = getEnvKey() ?? getLocalStorageKey();
  return typeof key === 'string' && key.length > 10;
}

export async function llmParse(
  text: string,
  threads: Thread[],
  proxyUrl?: string,
  signal?: AbortSignal,
): Promise<Detection[]> {
  if (!text.trim()) return [];

  const body = {
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt(threads) },
      { role: 'user', content: text.trim() },
    ],
  };

  let res: Response;
  if (proxyUrl && proxyUrl.trim().length > 0) {
    // Server-side path — key stays on Vercel.
    res = await fetch(`${proxyUrl.replace(/\/$/, '')}/api/groq`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } else {
    const key = getEnvKey() ?? getLocalStorageKey();
    if (!key) return [];
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  }

  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.warn('Groq parse failed:', res.status, await res.text().catch(() => ''));
    return [];
  }
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = json.choices?.[0]?.message?.content ?? '{}';
  let parsed: { items?: RawItem[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }
  const threadIds = new Set(threads.map((t) => t.id));
  const items = (parsed.items ?? []).filter(
    (i) => threadIds.has(i.thread_id) && typeof i.amount === 'number' && i.amount > 0,
  );
  return items.map((i, idx) => {
    const clause = (i.text ?? '').trim().slice(0, 120);
    return {
      key: `llm:${i.thread_id}:${idx}:${clause.slice(0, 40).toLowerCase()}`,
      threadId: i.thread_id,
      amount: i.amount,
      text: clause || text.trim().slice(0, 80),
      start: 0,
      end: 0,
    };
  });
}
