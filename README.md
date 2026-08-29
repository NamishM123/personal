# Progress Tracker

A personal daily/weekly progress tracker. Journal your day in free-form prose,
select chunks of text, tag them to threads (Social, Classes, LeetCode, Job Apps,
Clubs, Cooking, Working Out — configurable), and see per-thread daily and weekly
progress bars.

## Run it

```
npm install
npm run dev
```

Open the URL Vite prints. Data is stored in your browser's `localStorage` under
the key `personal-progress-tracker/v1`.

## Backup / sync across devices

Use the **Export** button to download a JSON snapshot; **Import** restores from
one. Commit the exported JSON to git if you want cross-device history.

## Editing threads and goals

Click **Settings** to add/rename/delete threads and change unit
(minutes / count / percent) or weekly goal. The daily goal is derived as
`weekly_goal / 7`; the week starts on Monday.

## Build

```
npm run build
```
