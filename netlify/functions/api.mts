import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import * as webpush from "web-push";

const store = () => getStore({ name: "plan", consistency: "strong" });

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async (req: Request, context: Context) => {
  const key = Netlify.env.get("APP_KEY");
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\//, "").split("/");
  const route = parts[0];
  // Images load through <img src>, which can't send headers, so media GETs may carry the key as ?k=
  const given = req.headers.get("x-key") || (route === "media" && req.method === "GET" ? url.searchParams.get("k") : null);
  if (!key || given !== key) return json({ error: "Wrong key" }, 401);
  const s = store();

  if (route === "media") {
    const id = parts[1] || "";
    if (!/^[a-z0-9-]{4,40}$/.test(id)) return json({ error: "Bad id" }, 400);
    if (req.method === "PUT") {
      const type = req.headers.get("content-type") || "";
      if (!/^image\/(jpeg|png|webp)$/.test(type)) return json({ error: "Images only" }, 415);
      const buf = await req.arrayBuffer();
      if (buf.byteLength > 4_500_000) return json({ error: "Too big" }, 413);
      await s.set(`media/${id}`, buf, { metadata: { type } });
      return json({ ok: true });
    }
    if (req.method === "GET") {
      const r: any = await s.getWithMetadata(`media/${id}`, { type: "arrayBuffer" });
      if (!r) return new Response("Not found", { status: 404 });
      return new Response(r.data, { headers: { "content-type": r.metadata?.type || "image/jpeg", "cache-control": "private, max-age=31536000, immutable" } });
    }
    if (req.method === "DELETE") { await s.delete(`media/${id}`); return json({ ok: true }); }
  }

  try {
    if (route === "all" && req.method === "GET") {
      const { blobs } = await s.list({ prefix: "days/" });
      const days: Record<string, unknown> = {};
      await Promise.all(
        blobs.map(async (b) => {
          days[b.key.slice(5)] = await s.get(b.key, { type: "json" });
        })
      );
      const body = (await s.get("body", { type: "json" })) ?? { height: null, entries: [] };
      const goals = (await s.get("goals", { type: "json" })) ?? { milestones: {}, shirts: 0, demos: 0, client: 0 };
      return json({ days, body, goals });
    }

    if (route === "day" && req.method === "PUT") {
      const date = parts[1];
      if (!DATE.test(date)) return json({ error: "Bad date" }, 400);
      const data = await req.json();
      await s.setJSON(`days/${date}`, data);
      return json({ ok: true });
    }

    if ((route === "body" || route === "goals") && req.method === "PUT") {
      await s.setJSON(route, await req.json());
      return json({ ok: true });
    }

    if (route === "estimate" && req.method === "POST") {
      const { text } = (await req.json()) as { text?: string };
      if (!text || !text.trim()) return json({ kcal: 0, protein: 0, fat: 0, carbs: 0, items: [] });
      const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
      if (!apiKey) return json({ error: "No ANTHROPIC_API_KEY set in Netlify" }, 503);
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: Netlify.env.get("ESTIMATE_MODEL") || "claude-haiku-5-5",
          max_tokens: 600,
          system:
            "You estimate nutrition for a food diary. The person mostly cooks at home. " +
            "Assume typical adult home portions unless amounts are given. A beer is a 330 ml lager unless stated. " +
            "Reply with JSON only, no prose: {\"kcal\":number,\"protein\":grams,\"fat\":grams,\"carbs\":grams,\"items\":[{\"name\":string,\"kcal\":number}]}. Round to whole numbers.",
          messages: [{ role: "user", content: text.slice(0, 600) }],
        }),
      });
      if (!r.ok) return json({ error: "Estimate failed (" + r.status + ")" }, 502);
      const out: any = await r.json();
      const raw = (out.content || []).map((c: any) => c.text || "").join("");
      const m = raw.match(/\{[\s\S]*\}/);
      try {
        const e = JSON.parse(m ? m[0] : raw);
        const n = (v: any) => Math.max(0, Math.round(Number(v) || 0));
        return json({ kcal: n(e.kcal), protein: n(e.protein), fat: n(e.fat), carbs: n(e.carbs), items: Array.isArray(e.items) ? e.items.slice(0, 12).map((i: any) => ({ name: String(i.name || "").slice(0, 60), kcal: n(i.kcal) })) : [] });
      } catch {
        return json({ error: "Couldn't read the estimate" }, 502);
      }
    }

    if (route === "vapid" && req.method === "GET") {
      return json({ key: Netlify.env.get("VAPID_PUBLIC") });
    }

    if (route === "subscribe" && req.method === "POST") {
      const sub = await req.json();
      if (!sub?.endpoint) return json({ error: "No subscription" }, 400);
      const subs: any[] = ((await s.get("push/subs", { type: "json" })) as any[]) ?? [];
      const next = subs.filter((x) => x.endpoint !== sub.endpoint);
      next.push(sub);
      await s.setJSON("push/subs", next);
      return json({ ok: true, devices: next.length });
    }

    if (route === "unsubscribe" && req.method === "POST") {
      const { endpoint } = (await req.json()) as { endpoint?: string };
      const subs: any[] = ((await s.get("push/subs", { type: "json" })) as any[]) ?? [];
      const next = subs.filter((x) => x.endpoint !== endpoint);
      await s.setJSON("push/subs", next);
      return json({ ok: true, devices: next.length });
    }

    if (route === "test-push" && req.method === "POST") {
      webpush.setVapidDetails(
        Netlify.env.get("VAPID_SUBJECT") || "mailto:alerts@example.com",
        Netlify.env.get("VAPID_PUBLIC")!,
        Netlify.env.get("VAPID_PRIVATE")!
      );
      const subs: any[] = ((await s.get("push/subs", { type: "json" })) as any[]) ?? [];
      let sent = 0;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            sub,
            JSON.stringify({ title: "Alerts are on", body: "You'll get a nudge 5 minutes before each block.", tag: "test" })
          );
          sent++;
        } catch (e) {
          console.log("test push failed", (e as any)?.statusCode);
        }
      }
      return json({ ok: true, sent, devices: subs.length });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
};

export const config: Config = { path: "/api/*" };
