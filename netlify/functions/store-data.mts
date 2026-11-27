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
  "commercialDocuments",
  "documentSettings",
  "customers",
] as const;

const DOC_TYPES = ["bl", "proforma", "facture", "receipt"] as const;

interface DocumentLike {
  id: string;
  type: string;
  number: string;
  date: string;
  status: string;
  customer?: { name?: string; phone?: string };
  lines?: Array<{ productName?: string; quantity?: number; unitPriceDZD?: number; discountDZD?: number }>;
  totalDZD?: number;
  paymentAmountDZD?: number;
  paymentMethod?: string;
  linkedFactureId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function validateCommercialDocumentsServer(
  incomingRaw: unknown,
  existingRaw?: unknown
): { ok: true; docs: DocumentLike[] } | { ok: false; error: string } {
  if (!Array.isArray(incomingRaw)) {
    return { ok: false, error: "commercialDocuments must be an array" };
  }

  const docs = incomingRaw as DocumentLike[];
  const existing = Array.isArray(existingRaw) ? (existingRaw as DocumentLike[]) : [];
  const existingMap = new Map(existing.map((d) => [d.id, d]));
  const seenNumbers = new Set<string>();

  for (const doc of docs) {
    if (!doc || typeof doc !== "object" || typeof doc.id !== "string" || !doc.id.trim()) {
      return { ok: false, error: "Invalid document ID" };
    }
    if (!DOC_TYPES.includes(doc.type as (typeof DOC_TYPES)[number])) {
      return { ok: false, error: `Invalid document type: ${String(doc.type)}` };
    }
    if (typeof doc.number !== "string" || !doc.number.trim()) {
      return { ok: false, error: "Document number is required" };
    }
    const upperNum = doc.number.trim().toUpperCase();
    if (seenNumbers.has(upperNum)) {
      return { ok: false, error: `Duplicate document number rejected: ${doc.number}` };
    }
    seenNumbers.add(upperNum);

    if (!doc.customer || typeof doc.customer.name !== "string" || !doc.customer.name.trim()) {
      return { ok: false, error: `Customer name missing on ${doc.number}` };
    }
    if (typeof doc.totalDZD !== "number" || !Number.isFinite(doc.totalDZD) || doc.totalDZD < 0) {
      return { ok: false, error: `Invalid totalDZD on ${doc.number}` };
    }

    // Enforce immutability of already-issued documents (only cancellation, BL delivery status, or Facture payment reconciliation allowed)
    const prev = existingMap.get(doc.id);
    if (prev && prev.status !== "draft") {
      if (doc.status === "draft") {
        return { ok: false, error: `Issued document ${prev.number} cannot revert to draft` };
      }
      if (doc.status !== "cancelled") {
        const linesChanged = JSON.stringify(prev.lines) !== JSON.stringify(doc.lines);
        const totalChanged = prev.totalDZD !== doc.totalDZD;
        const customerChanged = JSON.stringify(prev.customer) !== JSON.stringify(doc.customer);
        if (linesChanged || totalChanged || customerChanged) {
          return { ok: false, error: `Issued document ${prev.number} cannot be edited. Cancel and re-issue instead.` };
        }
      }
    }
  }

  return { ok: true, docs };
}

type AllowedKey = (typeof ALLOWED_KEYS)[number];

function isAllowedKey(key: string): key is AllowedKey {
  return (ALLOWED_KEYS as readonly string[]).includes(key);
}

interface TimestampedEnvelope {
  updatedAt: number;
  value: unknown;
}

interface OrderLike {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  statusHistory?: unknown[];
  [key: string]: unknown;
}

/**
 * Merges two order arrays by `id` so orders placed from any phone/browser
 * are never overwritten by a stale order list from another device.
 */
function mergeOrdersLists(existingRaw: unknown, incomingRaw: unknown): OrderLike[] {
  const existing = Array.isArray(existingRaw) ? (existingRaw as OrderLike[]) : [];
  const incoming = Array.isArray(incomingRaw) ? (incomingRaw as OrderLike[]) : [];

  const map = new Map<string, OrderLike>();

  for (const ord of existing) {
    if (ord && typeof ord === "object" && typeof ord.id === "string") {
      map.set(ord.id, ord);
    }
  }

  for (const ord of incoming) {
    if (ord && typeof ord === "object" && typeof ord.id === "string") {
      const prev = map.get(ord.id);
      if (!prev) {
        map.set(ord.id, ord);
      } else {
        const prevHistLen = Array.isArray(prev.statusHistory) ? prev.statusHistory.length : 0;
        const nextHistLen = Array.isArray(ord.statusHistory) ? ord.statusHistory.length : 0;
        const prevUpdated = prev.updatedAt ? Date.parse(String(prev.updatedAt)) || 0 : 0;
        const nextUpdated = ord.updatedAt ? Date.parse(String(ord.updatedAt)) || 0 : 0;

        if (nextHistLen > prevHistLen || nextUpdated >= prevUpdated) {
          map.set(ord.id, ord);
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const tA = a.createdAt ? Date.parse(String(a.createdAt)) || 0 : 0;
    const tB = b.createdAt ? Date.parse(String(b.createdAt)) || 0 : 0;
    return tB - tA;
  });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Cache-Control, Pragma",
};

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const headers = {
    ...CORS_HEADERS,
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

      return new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers,
      });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const body = await req.json();

      // Dedicated atomic order append operation
      if (body && body.action === "appendOrder" && body.order && typeof body.order.id === "string") {
        const updatedAt = Date.now();
        const existingEnvelope = (await store.get("orders", {
          type: "json",
          consistency: "strong",
        })) as TimestampedEnvelope | unknown;
        const existingOrders =
          existingEnvelope &&
          typeof existingEnvelope === "object" &&
          "value" in (existingEnvelope as Record<string, unknown>)
            ? (existingEnvelope as TimestampedEnvelope).value
            : existingEnvelope;

        const mergedOrders = mergeOrdersLists(existingOrders, [body.order]);
        await store.setJSON("orders", {
          updatedAt,
          value: mergedOrders,
        });

        return new Response(
          JSON.stringify({
            ok: true,
            key: "orders",
            updatedAt,
            ordersCount: mergedOrders.length,
            orders: mergedOrders,
          }),
          { status: 200, headers }
        );
      }

      if (body && typeof body.key === "string" && isAllowedKey(body.key)) {
        const updatedAt =
          typeof body.updatedAt === "number" ? body.updatedAt : Date.now();
        let valueToStore = body.value;

        // Always merge orders on the server so no customer order is ever lost
        if (body.key === "orders") {
          const existingEnvelope = (await store.get("orders", {
            type: "json",
            consistency: "strong",
          })) as TimestampedEnvelope | unknown;
          const existingOrders =
            existingEnvelope &&
            typeof existingEnvelope === "object" &&
            "value" in (existingEnvelope as Record<string, unknown>)
              ? (existingEnvelope as TimestampedEnvelope).value
              : existingEnvelope;
          valueToStore = mergeOrdersLists(existingOrders, body.value);
        }

        // Server-side validation for commercial documents
        if (body.key === "commercialDocuments") {
          const existingEnvelope = (await store.get("commercialDocuments", {
            type: "json",
            consistency: "strong",
          })) as TimestampedEnvelope | unknown;
          const existingDocs =
            existingEnvelope &&
            typeof existingEnvelope === "object" &&
            "value" in (existingEnvelope as Record<string, unknown>)
              ? (existingEnvelope as TimestampedEnvelope).value
              : existingEnvelope;

          const validation = validateCommercialDocumentsServer(body.value, existingDocs);
          if (!validation.ok) {
            return new Response(
              JSON.stringify({ ok: false, error: validation.error }),
              { status: 400, headers }
            );
          }
          valueToStore = validation.docs;
        }

        const envelope: TimestampedEnvelope = {
          updatedAt,
          value: valueToStore,
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
            let envelope: TimestampedEnvelope = isEnvelope
              ? (item as TimestampedEnvelope)
              : { updatedAt: now, value: item };

            if (k === "orders") {
              const existingEnvelope = (await store.get("orders", {
                type: "json",
                consistency: "strong",
              })) as TimestampedEnvelope | unknown;
              const existingOrders =
                existingEnvelope &&
                typeof existingEnvelope === "object" &&
                "value" in (existingEnvelope as Record<string, unknown>)
                  ? (existingEnvelope as TimestampedEnvelope).value
                  : existingEnvelope;
              envelope = {
                updatedAt: Math.max(envelope.updatedAt || now, now),
                value: mergeOrdersLists(existingOrders, envelope.value),
              };
            }

            if (k === "commercialDocuments") {
              const existingEnvelope = (await store.get("commercialDocuments", {
                type: "json",
                consistency: "strong",
              })) as TimestampedEnvelope | unknown;
              const existingDocs =
                existingEnvelope &&
                typeof existingEnvelope === "object" &&
                "value" in (existingEnvelope as Record<string, unknown>)
                  ? (existingEnvelope as TimestampedEnvelope).value
                  : existingEnvelope;
              const validation = validateCommercialDocumentsServer(envelope.value, existingDocs);
              if (!validation.ok) {
                return new Response(
                  JSON.stringify({ ok: false, error: validation.error }),
                  { status: 400, headers }
                );
              }
            }

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
