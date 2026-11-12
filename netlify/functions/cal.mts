import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { BLOCKS, DEADLINES, PLAN_START, PLAN_END } from "../../public/schedule.js";

// Live iCalendar feed. Subscribe in Google Calendar with "From URL".
// Google refreshes subscribed calendars on its own schedule (usually within a day).

// Your timezone. It must be one without daylight saving, as alerts use a fixed offset.
const TZ = { name: "Asia/Singapore", offset: 8, abbr: "+08" };

const BYDAY: Record<string, string> = { mon: "MO", tue: "TU", wed: "WE", thu: "TH", fri: "FR", sat: "SA", sun: "SU" };
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
const fold = (line: string) => {
  const out: string[] = [];
  while (line.length > 74) {
    out.push(line.slice(0, 74));
    line = " " + line.slice(74);
  }
  out.push(line);
  return out.join("\r\n");
};

function firstDate(days: string[]) {
  const order = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const [y, m, dd] = PLAN_START.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, dd));
  while (!days.includes(order[d.getUTCDay()])) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export default async (req: Request, context: Context) => {
  const key = Netlify.env.get("APP_KEY");
  const file = context.params.file || "";
  if (!key || file !== `${key}.ics`) return new Response("Not found", { status: 404 });

  let list: any[] = BLOCKS;
  let names: Record<string, string> = {}, times: Record<string, string> = {};
  try { const g: any = await getStore({ name: "plan", consistency: "strong" }).get("goals", { type: "json" }); names = g?.names || {}; times = g?.times || {}; if (Array.isArray(g?.schedule) && g.schedule.length) list = g.schedule; } catch {}
  const hm = (m: number) => String(Math.floor(m / 60)).padStart(2, "0") + String(m % 60).padStart(2, "0");
  const toM = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  // last minute of PLAN_END in local time, written in UTC
  const until = new Date(Date.parse(PLAN_END + "T23:59:59Z") - TZ.offset * 3600000).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const off = (TZ.offset >= 0 ? "+" : "-") + String(Math.abs(TZ.offset)).padStart(2, "0") + "00";
  const L: string[] = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//winning//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Winning", `X-WR-TIMEZONE:${TZ.name}`, "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "BEGIN:VTIMEZONE", `TZID:${TZ.name}`, "BEGIN:STANDARD", "DTSTART:19700101T000000",
    `TZOFFSETFROM:${off}`, `TZOFFSETTO:${off}`, `TZNAME:${TZ.abbr}`, "END:STANDARD", "END:VTIMEZONE",
  ];

  for (const b of list) {
    if (!b?.d?.length || !/^\d\d:\d\d$/.test(b.s) || !/^\d\d:\d\d$/.test(b.e)) continue;
    const d = firstDate(b.d);
    const desc = [b.sub, b.short ? "First two weeks: about two thirds of the full length." : ""].filter(Boolean).join("\n");
    L.push(
      "BEGIN:VEVENT", `UID:${b.id}@winning`, `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${TZ.name}:${d}T${hm(toM(times[b.id] || b.s))}00`,
      `DTEND;TZID=${TZ.name}:${d}T${hm(Math.min(toM(times[b.id] || b.s) + toM(b.e) - toM(b.s), 1439))}00`,
      `RRULE:FREQ=WEEKLY;BYDAY=${b.d.map((x) => BYDAY[x]).join(",")};UNTIL=${until}`,
      `SUMMARY:${esc(names[b.id] || b.t)}`
    );
    if (desc) L.push(`DESCRIPTION:${esc(desc)}`);
    L.push("END:VEVENT");
  }
  for (const dl of DEADLINES) {
    const d = dl.date.replace(/-/g, "");
    const next = new Date(dl.date + "T00:00:00Z");
    next.setUTCDate(next.getUTCDate() + 1);
    L.push(
      "BEGIN:VEVENT", `UID:dl-${dl.id}@winning`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`,
      `SUMMARY:${esc("Due: " + dl.t)}`, `CATEGORIES:${dl.area}`, "TRANSP:TRANSPARENT", "END:VEVENT"
    );
  }
  L.push("END:VCALENDAR");
  return new Response(L.map(fold).join("\r\n") + "\r\n", {
    headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "public, max-age=900" },
  });
};

export const config: Config = { path: "/cal/:file" };
