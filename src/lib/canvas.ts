import type { Assignment } from '../types';

interface CanvasAssignment {
  id: number;
  name: string;
  due_at: string | null;
  html_url: string;
  course_id: number;
}

interface CanvasCourse {
  id: number;
  name: string;
  course_code?: string;
}

function proxyUrl(base: string, path: string, params?: Record<string, string | number>): string {
  const clean = base.replace(/\/$/, '');
  const url = new URL(`${clean}/api/canvas`);
  url.searchParams.set('path', path);
  for (const [k, v] of Object.entries(params ?? {})) {
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`canvas ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/** Fetch active courses so we can attribute assignments to a course name. */
async function fetchCourses(base: string, signal?: AbortSignal): Promise<Map<number, string>> {
  const courses = await fetchJson<CanvasCourse[]>(
    proxyUrl(base, '/api/v1/courses', { enrollment_state: 'active', per_page: 100 }),
    signal,
  );
  const map = new Map<number, string>();
  for (const c of courses) map.set(c.id, c.name || c.course_code || `Course ${c.id}`);
  return map;
}

/** Fetch upcoming assignments across all active courses in the next N days. */
export async function fetchUpcomingAssignments(
  base: string,
  days: number = 14,
  signal?: AbortSignal,
): Promise<Assignment[]> {
  const courseMap = await fetchCourses(base, signal);
  const now = Date.now();
  const cutoff = now + days * 24 * 60 * 60 * 1000;

  const perCourse = await Promise.all(
    Array.from(courseMap.keys()).map(async (cid) => {
      try {
        return await fetchJson<CanvasAssignment[]>(
          proxyUrl(base, `/api/v1/courses/${cid}/assignments`, {
            per_page: 50,
            order_by: 'due_at',
            'bucket': 'upcoming',
          }),
          signal,
        );
      } catch {
        return [] as CanvasAssignment[];
      }
    }),
  );

  const all: Assignment[] = [];
  for (const list of perCourse) {
    for (const a of list) {
      if (!a.due_at) continue;
      const due = Date.parse(a.due_at);
      if (Number.isNaN(due) || due < now - 12 * 60 * 60 * 1000 || due > cutoff) continue;
      all.push({
        id: `canvas:${a.course_id}:${a.id}`,
        title: a.name,
        courseName: courseMap.get(a.course_id),
        dueAt: a.due_at,
        url: a.html_url,
        source: 'canvas',
      });
    }
  }
  all.sort((x, y) => Date.parse(x.dueAt) - Date.parse(y.dueAt));
  return all;
}
