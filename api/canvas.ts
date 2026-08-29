// Vercel serverless (or Netlify function) proxy for the Canvas LMS REST API.
// Deploy this repo to Vercel and set these env vars in the project:
//   CANVAS_BASE_URL   — e.g. https://canvas.school.edu
//   CANVAS_TOKEN      — a personal access token (Canvas → Account → Settings → New Access Token)
//   ALLOWED_ORIGIN    — the origin your frontend is served from, or "*" for any
//
// Client hits:  GET /api/canvas?path=/api/v1/users/self/upcoming_events
// The proxy forwards to `${CANVAS_BASE_URL}${path}` with the bearer token attached.
//
// Read-only. Only GET requests are proxied; anything else is rejected.

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): void;
  json(payload: unknown): void;
  send(payload: string): void;
  end(): void;
}

const ALLOWED_PATH_PREFIX = '/api/v1/';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.ALLOWED_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const base = process.env.CANVAS_BASE_URL;
  const token = process.env.CANVAS_TOKEN;
  if (!base || !token) {
    res.status(500).json({ error: 'canvas_not_configured' });
    return;
  }

  const pathRaw = req.query.path;
  const path = Array.isArray(pathRaw) ? pathRaw[0] : pathRaw;
  if (!path || !path.startsWith(ALLOWED_PATH_PREFIX)) {
    res.status(400).json({ error: 'invalid_path', message: `must start with ${ALLOWED_PATH_PREFIX}` });
    return;
  }

  // Forward remaining query params (skip our own "path").
  const extra: string[] = [];
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue;
    const values = Array.isArray(v) ? v : v == null ? [] : [v];
    for (const val of values) {
      extra.push(`${encodeURIComponent(k)}=${encodeURIComponent(val)}`);
    }
  }
  const sep = path.includes('?') ? '&' : '?';
  const url = `${base.replace(/\/$/, '')}${path}${extra.length ? sep + extra.join('&') : ''}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/json',
      },
    });
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json');
    res.send(body);
  } catch (err) {
    res.status(502).json({ error: 'upstream_error', message: String(err) });
  }
}
