// Vercel serverless proxy for the Groq chat-completions API. The key stays
// server-side; the client just POSTs a chat body to /api/groq and gets the
// response back. Only chat/completions is proxied.
//
// Env vars:
//   GROQ_API_KEY     — your Groq key
//   ALLOWED_ORIGIN   — the origin your frontend is served from, or "*"

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  on(event: string, cb: (chunk: Buffer) => void): void;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): void;
  json(payload: unknown): void;
  send(payload: string): void;
  end(): void;
}

async function readBody(req: VercelRequest): Promise<string> {
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  return await new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.ALLOWED_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'groq_not_configured' });
    return;
  }

  const rawBody = await readBody(req);
  try {
    const upstream = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${key}`,
        },
        body: rawBody,
      },
    );
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader(
      'content-type',
      upstream.headers.get('content-type') ?? 'application/json',
    );
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: 'upstream_error', message: String(err) });
  }
}
