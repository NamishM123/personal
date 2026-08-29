// Vercel serverless proxy for a Canvas per-user iCal feed.
// The iCal URL itself carries a secret verifier, so no server-side token
// is needed. We only forward to known Canvas host patterns to avoid
// becoming an open proxy.
//
// Client hits:  GET /api/ical?url=https%3A%2F%2Fcanvas.calpoly.edu%2Ffeeds%2Fcalendars%2Fuser_xxxx.ics
//
// Env vars:
//   ALLOWED_ORIGIN   — the origin your frontend is served from, or "*"

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

/** Only Canvas-shaped hostnames are proxied. */
function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h.endsWith('.instructure.com')) return true;
  // school-hosted Canvas: canvas.<school>.edu / canvas.<school>.org / bruinlearn.<school>.edu, etc.
  // Keep it tight: must have "canvas" or "learn" as the first label and end in a common edu TLD.
  if (/^(canvas|learn|bruinlearn|elearn|myclasses)\.[a-z0-9-]+\.(edu|edu\.[a-z]{2}|org|ac\.[a-z]{2})$/.test(h))
    return true;
  return false;
}

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

  const raw = req.query.url;
  const url = Array.isArray(raw) ? raw[0] : raw;
  if (!url) {
    res.status(400).json({ error: 'missing_url' });
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }
  if (parsed.protocol !== 'https:') {
    res.status(400).json({ error: 'https_required' });
    return;
  }
  if (!isAllowedHost(parsed.hostname)) {
    res.status(400).json({ error: 'host_not_allowed', host: parsed.hostname });
    return;
  }
  if (!parsed.pathname.startsWith('/feeds/calendars/')) {
    res.status(400).json({ error: 'not_a_canvas_ical_path' });
    return;
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: { accept: 'text/calendar, text/plain, */*' },
    });
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('content-type', 'text/calendar; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.send(body);
  } catch (err) {
    res.status(502).json({ error: 'upstream_error', message: String(err) });
  }
}
