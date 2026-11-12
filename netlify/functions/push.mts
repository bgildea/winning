import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import * as webpush from "web-push";
import { dayBlocks, weekDates, TARGETS, mins, DEADLINES, isShortWeek, PLAN_END } from "../../public/schedule.js";

// Runs every 5 minutes. Sends a push 5 minutes before each block, plus deadline nudges
// at 6pm the day before and 9am on the day. Times are in the TZ set below.

// Your timezone. It must be one without daylight saving, as alerts use a fixed offset.
const TZ = { name: "Asia/Singapore", offset: 8, abbr: "+08" };

const LEAD = 5;

function localNow() {
  const d = new Date(Date.now() + TZ.offset * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`,
    min: d.getUTCHours() * 60 + d.getUTCMinutes(),
    tomorrow: (() => {
      const t = new Date(d.getTime() + 86400000);
      return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`;
    })(),
  };
}

export default async () => {
  const pub = Netlify.env.get("VAPID_PUBLIC");
  const priv = Netlify.env.get("VAPID_PRIVATE");
  if (!pub || !priv) return;
  const now = localNow();
  if (now.date > PLAN_END) return;

  const s = getStore({ name: "plan", consistency: "strong" });
  const subs: any[] = ((await s.get("push/subs", { type: "json" })) as any[]) ?? [];
  if (!subs.length) return;

  const day: any = (await s.get(`days/${now.date}`, { type: "json" })) ?? {};
  const goals: any = (await s.get("goals", { type: "json" })) ?? {};
  const sentKey = `push/sent/${now.date}`;
  const sent: Record<string, boolean> = ((await s.get(sentKey, { type: "json" })) as any) ?? {};

  const due = (t: number) => t - now.min <= 1 && t - now.min >= -4;
  const msgs: { id: string; title: string; body: string }[] = [];

  for (const b of dayBlocks(now.date, day, goals)) {
    const t = mins(b.s) - LEAD;
    const sk = b.id + "@" + b.s;
    if (!due(t) || sent[sk] || day?.done?.[b.id]) continue;
    const short = b.short && isShortWeek(now.date) ? " (two thirds length this week)" : "";
    msgs.push({ id: sk, title: `${b.s} ${b.t}`, body: (b.sub ? b.sub : "Starts in 5 minutes") + short });
  }
  // Nudge at 22:00 if nothing has gone into the daily log yet.
  const logged = day?.done?.log || Object.values(day?.meals || {}).some((v: any) => String(v || "").trim()) || String(day?.wins || "").trim();
  if (due(22 * 60) && !logged && !sent["nudge-log"])
    msgs.push({ id: "nudge-log", title: "Daily log", body: "Two minutes: meals, one win, mood. Then journal and bed." });

  // At 12:30, flag weekly goals that can no longer be hit with the slots left this week.
  if (due(12 * 60 + 30) && !sent["nudge-week"]) {
    const wk = weekDates(now.date);
    const recs: Record<string, any> = {};
    await Promise.all(wk.map(async (d) => { recs[d] = d === now.date ? day : ((await s.get(`days/${d}`, { type: "json" })) ?? {}); }));
    const risk: string[] = [];
    for (const t of TARGETS.filter((x: any) => !x.counter)) {
      let done = 0, left = 0;
      for (const d of wk) for (const b of dayBlocks(d, recs[d], goals)) {
        if (b.counts !== t.key) continue;
        if (recs[d]?.done?.[b.id]) done++;
        else if (d > now.date || (d === now.date && mins(b.s) > now.min)) left++;
      }
      const need = t.n - done;
      if (need > 0 && left < need) risk.push(`${t.label}: ${need} to go, ${left} slot${left === 1 ? "" : "s"} left`);
    }
    if (risk.length) msgs.push({ id: "nudge-week", title: risk.length === 1 ? "Falling behind on one goal" : `Falling behind on ${risk.length} goals`, body: risk.slice(0, 3).join(". ") + ". Add an extra session in Plan, or let it go this week." });
  }

  for (const dl of DEADLINES) {
    if (goals?.milestones?.[dl.id]) continue;
    if (dl.date === now.tomorrow && due(18 * 60) && !sent[`dl-eve-${dl.id}`])
      msgs.push({ id: `dl-eve-${dl.id}`, title: "Due tomorrow", body: dl.t });
    if (dl.date === now.date && due(9 * 60) && !sent[`dl-day-${dl.id}`])
      msgs.push({ id: `dl-day-${dl.id}`, title: "Due today", body: dl.t });
  }
  if (!msgs.length) return;

  webpush.setVapidDetails(Netlify.env.get("VAPID_SUBJECT") || "mailto:alerts@example.com", pub, priv);
  const dead = new Set<string>();
  for (const m of msgs) {
    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, JSON.stringify({ title: m.title, body: m.body, tag: m.id }), { TTL: 600 });
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) dead.add(sub.endpoint);
        else console.log("push failed", e?.statusCode, e?.body);
      }
    }
    sent[m.id] = true;
  }
  await s.setJSON(sentKey, sent);
  if (dead.size) await s.setJSON("push/subs", subs.filter((x) => !dead.has(x.endpoint)));
};

export const config: Config = { schedule: "*/5 * * * *" };
