import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

const STORE_NAME = "top-laptop-store";
const CUSTOMERS_KEY = "customers";
const ALLOWED_TYPES = new Set(["shop", "company", "institution"]);

interface CustomerLike {
  id: string;
  companyName: string;
  contactPerson: string;
  clientType: "shop" | "company" | "institution";
  phone: string;
  email?: string;
  wilayaCode: number;
  wilayaNameFr: string;
  wilayaNameAr: string;
  address: string;
  nif?: string;
  rc?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Cache-Control",
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function validateCustomer(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!body.companyName || typeof body.companyName !== "string" || !body.companyName.trim()) {
    errors.push("Company / Store Name is required.");
  }
  if (!body.contactPerson || typeof body.contactPerson !== "string" || !body.contactPerson.trim()) {
    errors.push("Contact Person is required.");
  }
  if (typeof body.clientType !== "string" || !ALLOWED_TYPES.has(body.clientType)) {
    errors.push("Invalid clientType.");
  }
  if (!body.phone || typeof body.phone !== "string" || !body.phone.trim()) {
    errors.push("Phone number is required.");
  }
  if (body.email && typeof body.email === "string" && body.email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      errors.push("Invalid email address format.");
    }
  }
  return errors;
}

async function readCustomers(store: ReturnType<typeof getStore>): Promise<CustomerLike[]> {
  const raw = await store.get(CUSTOMERS_KEY, { type: "json", consistency: "strong" });
  if (Array.isArray(raw)) return raw as CustomerLike[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { value?: unknown }).value)) {
    return (raw as { value: CustomerLike[] }).value;
  }
  return [];
}

async function saveCustomers(store: ReturnType<typeof getStore>, customers: CustomerLike[]) {
  await store.setJSON(CUSTOMERS_KEY, { updatedAt: Date.now(), value: customers });
}

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const lastSeg = parts[parts.length - 1];
    const targetId =
      lastSeg && lastSeg !== "customers" ? decodeURIComponent(lastSeg) : null;

    if (req.method === "GET") {
      const customers = await readCustomers(store);
      if (targetId) {
        const found = customers.find((c) => c.id === targetId);
        if (!found) return jsonResponse(404, { ok: false, error: "Customer not found" });
        return jsonResponse(200, { ok: true, source: "netlify-blobs", customer: found });
      }
      return jsonResponse(200, { ok: true, source: "netlify-blobs", customers });
    }

    if (req.method === "POST") {
      const body = (await req.json()) as Record<string, unknown>;
      const errors = validateCustomer(body);
      if (errors.length > 0) return jsonResponse(400, { ok: false, error: errors[0], errors });

      const customers = await readCustomers(store);
      const newCustomer: CustomerLike = {
        id: "cust-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
        companyName: String(body.companyName).trim(),
        contactPerson: String(body.contactPerson).trim(),
        clientType: body.clientType as CustomerLike["clientType"],
        phone: String(body.phone).trim(),
        email: body.email ? String(body.email).trim() : "",
        wilayaCode: Number(body.wilayaCode) || 16,
        wilayaNameFr: String(body.wilayaNameFr || "16 - Alger"),
        wilayaNameAr: String(body.wilayaNameAr || "16 - الجزائر"),
        address: String(body.address || "").trim(),
        nif: body.nif ? String(body.nif).trim() : "",
        rc: body.rc ? String(body.rc).trim() : "",
        notes: body.notes ? String(body.notes).trim() : "",
        createdAt: new Date().toISOString(),
      };

      const nextCustomers = [newCustomer, ...customers];
      await saveCustomers(store, nextCustomers);
      return jsonResponse(201, {
        ok: true,
        source: "netlify-blobs",
        customer: newCustomer,
        customers: nextCustomers,
      });
    }

    if (req.method === "PUT" && targetId) {
      const body = (await req.json()) as Record<string, unknown>;
      const errors = validateCustomer(body);
      if (errors.length > 0) return jsonResponse(400, { ok: false, error: errors[0], errors });

      const customers = await readCustomers(store);
      const idx = customers.findIndex((c) => c.id === targetId);
      if (idx === -1) return jsonResponse(404, { ok: false, error: "Customer not found" });

      const updated: CustomerLike = {
        ...customers[idx],
        companyName: String(body.companyName).trim(),
        contactPerson: String(body.contactPerson).trim(),
        clientType: body.clientType as CustomerLike["clientType"],
        phone: String(body.phone).trim(),
        email: body.email ? String(body.email).trim() : "",
        wilayaCode: Number(body.wilayaCode) || customers[idx].wilayaCode || 16,
        wilayaNameFr: String(body.wilayaNameFr || customers[idx].wilayaNameFr || ""),
        wilayaNameAr: String(body.wilayaNameAr || customers[idx].wilayaNameAr || ""),
        address: String(body.address || "").trim(),
        nif: body.nif ? String(body.nif).trim() : "",
        rc: body.rc ? String(body.rc).trim() : "",
        notes: body.notes ? String(body.notes).trim() : "",
        updatedAt: new Date().toISOString(),
      };

      const nextCustomers = [...customers];
      nextCustomers[idx] = updated;
      await saveCustomers(store, nextCustomers);
      return jsonResponse(200, {
        ok: true,
        source: "netlify-blobs",
        customer: updated,
        customers: nextCustomers,
      });
    }

    if (req.method === "DELETE" && targetId) {
      const customers = await readCustomers(store);
      if (!customers.some((c) => c.id === targetId)) {
        return jsonResponse(404, { ok: false, error: "Customer not found" });
      }
      const nextCustomers = customers.filter((c) => c.id !== targetId);
      await saveCustomers(store, nextCustomers);
      return jsonResponse(200, {
        ok: true,
        source: "netlify-blobs",
        id: targetId,
        customers: nextCustomers,
      });
    }

    return jsonResponse(405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: error instanceof Error ? error.message : "Database error",
    });
  }
};
