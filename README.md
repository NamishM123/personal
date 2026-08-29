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
2. **Groq LLM parser** (optional) — set `VITE_GROQ_API_KEY` in `.env.local` (or
   paste it into `localStorage` under the key `groqApiKey`). Runs ~700 ms after
   you stop typing, catches phrasing the rules miss. Detections it adds show up
   with an **AI** tag on the chip.

Dismissed chips stay dismissed for that day.

## Canvas assignments

The Canvas REST API doesn't send CORS headers, so a static Vite app can't call
it directly. This repo ships a serverless proxy (`api/canvas.ts`) you deploy
alongside the app on Vercel.

1. Deploy this repo to Vercel.
2. In the Vercel project's environment variables, set:
   - `CANVAS_BASE_URL` — e.g. `https://canvas.your-school.edu`
   - `CANVAS_TOKEN` — from Canvas → Account → Settings → **New Access Token**
   - `ALLOWED_ORIGIN` — your deployment origin, or `*` while testing
3. Open the deployed app, paste the deployment URL (e.g.
   `https://your-app.vercel.app`) into the Assignments panel, and hit
   **Sync Canvas**.

The proxy only forwards `GET` requests to paths that start with `/api/v1/`.

Assignments show up grouped by Overdue / Today / This week / Later. Checking
one credits it to today and moves the Coursework bar. You can also add
assignments manually — no Canvas required.

## Build

```
npm run build
```
