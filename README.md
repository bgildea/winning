# Winning

A personal planner I built to get through the last two months of the year with something to show for them. It's a phone-first web app: the day's plan as a dial and a checklist, a food and mood log, weigh-ins, goals with deadlines, and a gallery of finished work. It runs entirely on Netlify, with no database server and no framework.

The plan in this repo is a sample. Mine stays private.

## What it does

- **Today.** A 24-hour dial with the current block, a checklist you tick by swiping, drag to move a block, and a reason when you skip one. A "minimum day" of three must-dos for the rough days.
- **Goals.** Weekly targets (sessions, applications, outreach) plus big goals that show whether you're on pace for the deadline, not just a count.
- **30/70 split.** How your working time actually divides between your own projects and the job search, from what you ticked.
- **Log.** Meals typed or spoken, with calories and macros estimated by Claude. Mood, energy, wins.
- **Body.** Daily weigh-ins with a 7-day average, a weight goal and a calorie target.
- **Gallery.** Finished drawings and song demos. Photos open full size, and links from Google Drive, Dropbox, SoundCloud, YouTube or Vimeo play inside the app.
- **Progress.** A weekly review that picks out what keeps getting skipped and why, streaks, and a heatmap of the whole period.
- **Alerts and calendar.** Push notifications five minutes before each block, deadline reminders, and a live `.ics` feed for Google Calendar.
- **Offline.** It keeps working without a connection and syncs when it's back.

## How it's built

- `public/index.html` is the whole front end: one file of plain HTML, CSS and JavaScript, rendered from a single state object.
- `public/schedule.js` is the plan. The app, the push function and the calendar feed all read it, so there's one source of truth.
- `netlify/functions/api.mts` stores everything in Netlify Blobs: one document per day, plus body stats, goals and gallery images. Every request needs the app key.
- `netlify/functions/push.mts` runs every five minutes on a schedule and sends Web Push alerts.
- `netlify/functions/cal.mts` serves the calendar feed at `/cal/<key>.ics`.
- `public/sw.js` is a network-first service worker for offline use and push.

## Running your own

1. Fork this repo and connect it to a new Netlify site. There's no build step: Netlify publishes `public/` and bundles the functions.
2. Set these environment variables in Netlify (names are in `.env.example`):
   - `APP_KEY`: a long random string. You type it once on each device to unlock the app.
   - `VAPID_PUBLIC` and `VAPID_PRIVATE`: generate a pair with `npx web-push generate-vapid-keys`.
   - `VAPID_SUBJECT` (optional): a `mailto:` address for push services.
   - `ANTHROPIC_API_KEY` (optional): turns on calorie estimates. `ESTIMATE_MODEL` picks the model.
3. Edit `public/schedule.js` with your own routine, targets and deadlines.
4. Set your timezone in `TZ` at the top of `netlify/functions/push.mts` and `netlify/functions/cal.mts`. Pick one without daylight saving.
5. On iPhone, open the site in Safari and add it to your Home Screen to get alerts.

## Notes

This is a single-user app. The key is the only lock, so treat it like a password and keep the site off search engines if that matters to you.
