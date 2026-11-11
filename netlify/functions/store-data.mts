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

export default async (req: Request, _context: Context) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };

  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });

    if (req.method === "GET") {
      const url = new URL(req.url);
      const singleKey = url.searchParams.get("key");

      if (singleKey) {
        if (!isAllowedKey(singleKey)) {
          return new Response(
            JSON.stringify({ ok: false, error: `Invalid key: ${singleKey}` }),
            { status: 400, headers }
          );
        }
        const value = await store.get(singleKey, { type: "json", consistency: "strong" });
        return new Response(
          JSON.stringify({ ok: true, key: singleKey, value }),
          { status: 200, headers }
        );
      }

      const entries = await Promise.all(
        ALLOWED_KEYS.map(async (k) => {
          const val = await store.get(k, { type: "json", consistency: "strong" });
          return [k, val] as const;
        })
      );

      const data: Record<string, unknown> = {};
      for (const [k, val] of entries) {
        if (val !== null && val !== undefined) {
          data[k] = val;
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
        await store.setJSON(body.key, body.value);
        return new Response(
          JSON.stringify({
            ok: true,
            key: body.key,
            updatedAt: new Date().toISOString(),
          }),
          { status: 200, headers }
        );
      }

      if (body && body.batch && typeof body.batch === "object") {
        const updates: Promise<unknown>[] = [];
        for (const [k, v] of Object.entries(body.batch)) {
          if (isAllowedKey(k) && v !== undefined) {
            updates.push(store.setJSON(k, v));
          }
        }
        await Promise.all(updates);
        return new Response(
          JSON.stringify({
            ok: true,
            updatedAt: new Date().toISOString(),
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
