import type { Assignment } from '../types';

/** Un-fold RFC 5545 line continuations (CRLF + space/tab → nothing). */
function unfold(text: string): string {
  return text.replace(/\r?\n[ \t]/g, '');
}

/** Unescape iCal TEXT values: \\ , \; \, \n \N. */
function unesc(s: string): string {
  return s
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** Turn 20260904T190000Z or 20260904 into an ISO 8601 timestamp. */
function icalDateToIso(raw: string): string | null {
  const s = raw.trim();
  const m = s.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, hh = '00', mm = '00', ss = '00', z] = m;
  if (z) return `${y}-${mo}-${d}T${hh}:${mm}:${ss}Z`;
  // No Z → floating time; treat as local, produce local ISO.
  const dt = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
  );
  return dt.toISOString();
}

interface RawEvent {
  uid?: string;
  summary?: string;
  description?: string;
  url?: string;
  dtstart?: string;
  dtend?: string;
  categories?: string;
}

/**
 * Parse a Canvas iCal feed body into Assignment records. Canvas emits
 * assignments as VEVENTs whose UID starts with "event-assignment-" and
 * whose SUMMARY line is "<name> [<course>]".
 */
export function parseCanvasIcal(body: string): Assignment[] {
  const text = unfold(body);
  const events: RawEvent[] = [];
  let cur: RawEvent | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (line === 'BEGIN:VEVENT') {
      cur = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (cur) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const head = line.slice(0, colon);
    const val = line.slice(colon + 1);
    const name = head.split(';')[0].toUpperCase();
    switch (name) {
      case 'UID':
        cur.uid = val;
        break;
      case 'SUMMARY':
        cur.summary = unesc(val);
        break;
      case 'DESCRIPTION':
        cur.description = unesc(val);
        break;
      case 'URL':
        cur.url = val;
        break;
      case 'DTSTART':
        cur.dtstart = val;
        break;
      case 'DTEND':
        cur.dtend = val;
        break;
      case 'CATEGORIES':
        cur.categories = val;
        break;
    }
  }

  const out: Assignment[] = [];
  for (const e of events) {
    if (!e.uid || !e.summary) continue;
    // Canvas assignment events all carry "event-assignment-" in the UID.
    const isAssignment =
      /assignment/i.test(e.uid) || /assignment/i.test(e.categories ?? '');
    if (!isAssignment) continue;
    const rawDate = e.dtend || e.dtstart;
    if (!rawDate) continue;
    const iso = icalDateToIso(rawDate);
    if (!iso) continue;

    // Canvas summary format: "Assignment Name [Course Name]"
    let title = e.summary.trim();
    let courseName: string | undefined;
    const bracket = title.match(/^(.*)\s*\[([^\]]+)\]\s*$/);
    if (bracket) {
      title = bracket[1].trim();
      courseName = bracket[2].trim();
    }

    out.push({
      id: `canvas-ical:${e.uid}`,
      title,
      courseName,
      dueAt: iso,
      url: e.url,
      source: 'canvas',
    });
  }
  return out;
}

/** Fetch and parse the iCal feed via the serverless proxy. */
export async function fetchIcalAssignments(
  proxyBase: string,
  icalUrl: string,
  signal?: AbortSignal,
): Promise<Assignment[]> {
  const proxy = `${proxyBase.replace(/\/$/, '')}/api/ical?url=${encodeURIComponent(icalUrl)}`;
  const res = await fetch(proxy, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ical ${res.status}: ${body.slice(0, 200)}`);
  }
  const body = await res.text();
  return parseCanvasIcal(body);
}
