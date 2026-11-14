import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

const STORE_NAME = "top-laptop-store";
const ALLOWED_KEYS = [
  "products",
  "settings",
  "wilayas",
  "deliveryCompanies",
  "employees",
  "orders",
  "inventoryMovements",
  "activityLogs",
  "themeSettings",
] as const;

type AllowedKey = (typeof ALLOWED_KEYS)[number];

function isAllowedKey(key: string): key is AllowedKey {
  return (ALLOWED_KEYS as readonly string[]).includes(key);
}

interface TimestampedEnvelope {
  updatedAt: number;
  value: unknown;
}

export default async (req: Request, _context: Context) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };

  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });

    if (req.method === "GET") {
      const entries = await Promise.all(
        ALLOWED_KEYS.map(async (k) => {
          const raw = await store.get(k, { type: "json", consistency: "strong" });
          return [k, raw] as const;
        })
      );

      const data: Record<string, TimestampedEnvelope> = {};
      for (const [k, raw] of entries) {
        if (raw !== null && raw !== undefined) {
          if (
            typeof raw === "object" &&
            "updatedAt" in (raw as Record<string, unknown>) &&
            "value" in (raw as Record<string, unknown>)
          ) {
            data[k] = raw as TimestampedEnvelope;
          } else {
            data[k] = { updatedAt: 1, value: raw };
          }
        }
      }

      return new Response(
        JSON.stringify({ ok: true, data }),
        { status: 200, headers }
      );
    }

    if (req.method === "POST" || req.method === "PUT") {
      const body = await req.json();

      if (body && typeof body.key === "string" && isAllowedKey(body.key)) {
        const updatedAt =
          typeof body.updatedAt === "number" ? body.updatedAt : Date.now();
        const envelope: TimestampedEnvelope = {
          updatedAt,
          value: body.value,
        };
        await store.setJSON(body.key, envelope);
        return new Response(
          JSON.stringify({
            ok: true,
            key: body.key,
            updatedAt,
          }),
          { status: 200, headers }
        );
      }

      if (body && body.batch && typeof body.batch === "object") {
        const updates: Promise<unknown>[] = [];
        const now = Date.now();
        for (const [k, item] of Object.entries(body.batch)) {
          if (isAllowedKey(k) && item !== undefined && item !== null) {
            const isEnvelope =
              typeof item === "object" &&
              "updatedAt" in (item as Record<string, unknown>) &&
              "value" in (item as Record<string, unknown>);
            const envelope: TimestampedEnvelope = isEnvelope
              ? (item as TimestampedEnvelope)
              : { updatedAt: now, value: item };
            updates.push(store.setJSON(k, envelope));
          }
        }
        await Promise.all(updates);
        return new Response(
          JSON.stringify({
            ok: true,
            updatedAt: now,
          }),
          { status: 200, headers }
        );
      }

      return new Response(
        JSON.stringify({ ok: false, error: "Invalid request payload" }),
        { status: 400, headers }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers }
    );
  } catch (error) {
    console.error("Netlify Blobs store-data error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Internal storage error",
      }),
      { status: 500, headers }
    );
  }
};
