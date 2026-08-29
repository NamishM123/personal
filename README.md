# Progress Tracker

A personal daily/weekly progress tracker. Journal your day in free-form prose;
the app parses it and fills a progress bar per thread (Social, Classes,
LeetCode, Job Apps, Clubs, Cooking, Working Out, Coursework — configurable).

## Local dev

```
npm install
cp .env.example .env.local   # add VITE_GROQ_API_KEY here if you have a Groq key
npm run dev
```

Data is stored in your browser's `localStorage` under
`personal-progress-tracker/v2`. Use **Export** / **Import** in the header to
back up a JSON snapshot.

## Journal parsing

Two layers, applied to the same entry:

1. **Rule parser** (always on) — keyword aliases per thread plus duration/count
   regex. Fires instantly as you type.
2. **Groq LLM parser** (optional) — runs ~700 ms after you stop typing, catches
   phrasing the rules miss. Detections it adds show up with an **AI** tag on the
   chip. Two ways to configure:
   - **Production (recommended):** deploy to Vercel and set the env var
     `GROQ_API_KEY` (no `VITE_` prefix). The client calls
     `<your-app>/api/groq` and the key stays on the server.
   - **Local dev only:** set `VITE_GROQ_API_KEY` in `.env.local`. This ships in
     the browser bundle, so don't use it for a deployed site.

Dismissed chips stay dismissed for that day.

## Canvas assignments

Canvas doesn't send CORS headers, so a static Vite app can't call it directly.
This repo ships two serverless proxies you can deploy alongside the app on
Vercel — pick whichever your school allows.

### Option A: personal iCal feed (recommended — no token needed)

Most schools disable personal access tokens for students but leave the iCal
feed enabled. That's a URL like
`https://canvas.your-school.edu/feeds/calendars/user_XXXXXX.ics` — the URL
itself carries a secret, so no token is required.

1. Deploy this repo to Vercel.
2. Set the env var `ALLOWED_ORIGIN` (your deployment origin, or `*` while testing).
3. In Canvas, click **Calendar** → scroll to the bottom of the right column →
   **Calendar Feed** → copy the URL.
4. Open the deployed app → click **Configure** on the Assignments panel → paste
   your Vercel URL and the iCal URL → **Save** → **Sync**.

The `api/ical.ts` proxy only forwards HTTPS GETs to `*.instructure.com` and
`canvas.<school>.edu`-style hosts under `/feeds/calendars/`. If the iCal URL
ever leaks, rotate it in Canvas (Calendar → Calendar Feed → **Reset**).

### Option B: personal access token (only if your school allows)

Skip if the **+ New Access Token** button in Canvas → Account → Settings does
nothing. Otherwise:

1. Deploy this repo to Vercel and set:
   - `CANVAS_BASE_URL` — e.g. `https://canvas.your-school.edu`
   - `CANVAS_TOKEN` — Canvas → Account → Settings → **New Access Token**
   - `ALLOWED_ORIGIN` — your deployment origin, or `*`
2. Open the app, paste the Vercel URL into the Assignments panel, leave the
   iCal field blank, hit **Sync**.

The `api/canvas.ts` proxy only forwards GETs to paths starting with `/api/v1/`.

### Regardless of path

Assignments show up grouped by Overdue / Today / This week / Later. Checking
one credits it to today and bumps the Coursework bar. You can also add
assignments manually — no Canvas required.

## Build

```
npm run build
```
