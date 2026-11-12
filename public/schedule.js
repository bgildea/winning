// The plan: one source of truth for the app, push alerts and the calendar feed.
// This is a sample. Change the blocks, targets and deadlines to your own.

export const PLAN_START = "2026-11-09";
export const PLAN_END = "2026-12-31";
export const SHORT_UNTIL = "2026-11-22"; // first two weeks at two thirds length, to ease in

const ALL = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WD = ["mon", "tue", "wed", "thu", "fri"];
const MTWT = ["mon", "tue", "wed", "thu"];

// cat: work, job, fitness, creative, food, health, people
// counts: which weekly target a ticked block adds to (see TARGETS)
export const BLOCKS = [
  { id: "weigh", t: "Weigh in", sub: "First thing, before food", s: "07:00", e: "07:05", d: ALL, cat: "health" },
  { id: "morning", t: "Tea and meditate 10 min", sub: "Morning sit, first of two", s: "07:05", e: "07:45", d: ALL, cat: "health", counts: "meditation" },
  { id: "deep", t: "Deep work", sub: "Your most important project, phone in another room", s: "08:30", e: "12:00", d: WD, cat: "work", counts: "deep" },
  { id: "lunch", t: "Cook and eat lunch", s: "12:00", e: "13:00", d: WD, cat: "food" },
  { id: "ex-weights", t: "Weights 20 min, walk 30 min", s: "13:15", e: "14:30", d: ["mon", "thu"], cat: "fitness", counts: "exercise", short: true },
  { id: "ex-bike", t: "Bike 30 min", s: "13:15", e: "14:30", d: ["tue"], cat: "fitness", counts: "exercise", short: true },
  { id: "ex-yoga", t: "Yoga 30 min, walk 30 min", s: "13:15", e: "14:45", d: ["wed"], cat: "fitness", counts: "exercise", short: true },
  { id: "ex-swim", t: "Swim", s: "13:15", e: "14:30", d: ["fri"], cat: "fitness", counts: "exercise", short: true },
  { id: "job", t: "Job search", sub: "10 applications a week, log each one", s: "15:00", e: "16:30", d: WD, cat: "job" },
  { id: "portrait", t: "Drawing session", sub: "A short study, then the main piece", s: "16:45", e: "17:45", d: WD, cat: "creative", counts: "portrait" },
  { id: "guitar", t: "Guitar", sub: "20 min technique, 20 min songs", s: "18:00", e: "18:40", d: ["mon", "wed"], cat: "creative", counts: "guitar" },
  { id: "piano", t: "Piano", sub: "Scales, then the piece you're learning", s: "18:00", e: "18:30", d: ["tue", "thu"], cat: "creative", counts: "piano" },
  { id: "song-fri", t: "Songwriting", sub: "A phone demo counts as finished", s: "17:45", e: "18:15", d: ["fri"], cat: "creative", counts: "song" },
  { id: "reach-fri", t: "Message a friend", s: "18:15", e: "18:30", d: ["fri"], cat: "people", counts: "contact" },
  { id: "friends", t: "Night out with friends", s: "19:00", e: "22:00", d: ["fri"], cat: "people" },
  { id: "dinner", t: "Cook dinner and eat", s: "18:45", e: "19:45", d: MTWT, cat: "food" },
  { id: "song", t: "Songwriting", sub: "A phone demo counts as finished", s: "20:00", e: "20:30", d: MTWT, cat: "creative", counts: "song" },
  { id: "reach", t: "Message a friend or family", sub: "Text, voice note or a quick call", s: "20:30", e: "20:45", d: MTWT, cat: "people", counts: "contact" },
  { id: "guitar-sat", t: "Guitar", s: "09:30", e: "10:10", d: ["sat"], cat: "creative", counts: "guitar" },
  { id: "song-sat", t: "Songwriting", s: "10:15", e: "10:45", d: ["sat"], cat: "creative", counts: "song" },
  { id: "walk-sat", t: "Long walk, 45 to 60 min", s: "11:00", e: "12:00", d: ["sat"], cat: "fitness", counts: "exercise", short: true },
  { id: "shop-sat", t: "Weekly grocery shop", s: "14:00", e: "15:00", d: ["sat"], cat: "food" },
  { id: "piano-sun", t: "Piano", s: "09:30", e: "09:55", d: ["sun"], cat: "creative", counts: "piano" },
  { id: "guitar-sun", t: "Guitar", s: "10:00", e: "10:40", d: ["sun"], cat: "creative", counts: "guitar" },
  { id: "song-sun", t: "Songwriting", s: "10:45", e: "11:15", d: ["sun"], cat: "creative", counts: "song" },
  { id: "prep-sun", t: "Food prep for the week", s: "16:00", e: "16:45", d: ["sun"], cat: "food" },
  { id: "family-sun", t: "Family call", s: "17:30", e: "18:15", d: ["sun"], cat: "people", counts: "contact" },
  { id: "review-sun", t: "Sunday review", sub: "What did I finish? Photograph the week's drawing", s: "19:00", e: "19:30", d: ["sun"], cat: "health" },
  { id: "log", t: "Daily log", sub: "Meals, wins, mood", s: "21:45", e: "22:00", d: ALL, cat: "health" },
  { id: "journal", t: "Journal on paper, screens off", s: "22:00", e: "22:20", d: ALL, cat: "health" },
  { id: "meditate-pm", t: "Meditate 10 min", sub: "Evening sit, second of the day", s: "22:20", e: "22:30", d: ALL, cat: "health", counts: "meditation" },
  { id: "bed", t: "In bed", s: "22:30", e: "22:35", d: ALL, cat: "health", counts: "sleep" },
];

export const TARGETS = [
  { key: "portrait", label: "Drawing sessions", n: 5 },
  { key: "guitar", label: "Guitar", n: 4 },
  { key: "piano", label: "Piano", n: 3 },
  { key: "song", label: "Songwriting", n: 7 },
  { key: "exercise", label: "Exercise", n: 6 },
  { key: "meditation", label: "Meditation, 2 x 10 min a day", n: 14 },
  { key: "contact", label: "Friends and family", n: 5 },
  { key: "sleep", label: "In bed on time", n: 7 },
  { key: "apps", label: "Job applications", n: 10, counter: true },
  { key: "outreach", label: "Client outreach", n: 5, counter: true },
];

// ids the app looks for: portrait-1 to portrait-5 (portrait pace), demos (demo pace), sales-start (sales pace)
export const DEADLINES = [
  { id: "portfolio", date: "2026-11-13", t: "Portfolio site live", area: "Income" },
  { id: "cv", date: "2026-11-16", t: "CV and cover letter updated", area: "Income" },
  { id: "side-start", date: "2026-11-15", t: "Side project started", area: "Business" },
  { id: "portrait-1", date: "2026-11-18", t: "Portrait 1 finished", area: "Creative" },
  { id: "side-mvp", date: "2026-11-22", t: "Side project first version", area: "Business" },
  { id: "portrait-2", date: "2026-11-28", t: "Portrait 2 finished", area: "Creative" },
  { id: "demos", date: "2026-11-29", t: "10 demos, best 3 picked", area: "Creative" },
  { id: "sales-start", date: "2026-11-30", t: "First things on sale", area: "Business" },
  { id: "portrait-3", date: "2026-12-08", t: "Portrait 3 finished", area: "Creative" },
  { id: "record", date: "2026-12-18", t: "Three songs recorded", area: "Creative" },
  { id: "portrait-4", date: "2026-12-18", t: "Portrait 4 finished", area: "Creative" },
  { id: "portrait-5", date: "2026-12-28", t: "Portrait 5 finished", area: "Creative" },
  { id: "piano-3", date: "2026-12-31", t: "Three songs from memory on piano", area: "Creative" },
];

export const BIG = [
  { key: "apps", label: "Job applications", n: 75, auto: true },
  { key: "shirts", label: "Sales", n: 20 },
  { key: "demos", label: "Song demos", n: 10 },
  { key: "portraits", label: "Portraits finished", n: 5, auto: true, note: "Counted from the gallery" },
  { key: "client", label: "Paying client signed", n: 1 },
  { key: "books", label: "Books read this year", n: 12 },
];

const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function ymd(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function parseYmd(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function dowOf(dateStr) {
  return DOW[parseYmd(dateStr).getDay()];
}
export function mins(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
export function blocksFor(dateStr, list = BLOCKS) {
  const dow = dowOf(dateStr);
  return (list || BLOCKS).filter((b) => b.d.includes(dow)).sort((a, b) => mins(a.s) - mins(b.s) || mins(a.e) - mins(b.e));
}
const hm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
// The day's blocks with changes applied. goals.times / goals.names change every occurrence;
// rec.moved / rec.names change that one day only (day-only wins).
export function dayBlocks(dateStr, rec, goals) {
  const dm = (rec && rec.moved) || {}, dn = (rec && rec.names) || {};
  const gm = (goals && goals.times) || {}, gn = (goals && goals.names) || {};
  return blocksFor(dateStr, goals && goals.schedule)
    .map((b) => {
      const base = gm[b.id] || b.s, st = dm[b.id] || base, name = dn[b.id] || gn[b.id];
      if (st === b.s && !name) return { ...b, base };
      const len = mins(b.e) - mins(b.s), m = mins(st);
      return {
        ...b, s: st, e: hm(Math.min(m + len, 24 * 60 - 1)), base,
        planned: st !== b.s ? b.s : undefined, movedScope: dm[b.id] ? "day" : gm[b.id] ? "all" : null,
        t: name || b.t, orig: name ? b.t : undefined, nameScope: dn[b.id] ? "day" : gn[b.id] ? "all" : null, baseName: gn[b.id] || b.t,
      };
    })
    .sort((a, b) => mins(a.s) - mins(b.s) || mins(a.e) - mins(b.e));
}
export function isShortWeek(dateStr) {
  return dateStr <= SHORT_UNTIL;
}
export function weekDates(dateStr) {
  const d = parseYmd(dateStr);
  const offset = (d.getDay() + 6) % 7; // Monday first
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => ymd(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i)));
}
