import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_TYPES = new Set(['shop', 'company', 'institution']);

function ensureDbFile(dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '[]', 'utf-8');
  }
}

export function readCustomersDb(dbPath) {
  ensureDbFile(dbPath);
  try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCustomersDb(dbPath, customers) {
  ensureDbFile(dbPath);
  const tmpPath = `${dbPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(customers, null, 2), 'utf-8');
  fs.renameSync(tmpPath, dbPath);
}

function validateCustomerPayload(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return ['Invalid JSON payload'];
  }
  if (!body.companyName || typeof body.companyName !== 'string' || !body.companyName.trim()) {
    errors.push('Company / Store Name is required.');
  }
  if (!body.contactPerson || typeof body.contactPerson !== 'string' || !body.contactPerson.trim()) {
    errors.push('Contact Person is required.');
  }
  if (!ALLOWED_TYPES.has(body.clientType)) {
    errors.push('Invalid clientType (must be shop, company, or institution).');
  }
  if (!body.phone || typeof body.phone !== 'string' || !body.phone.trim()) {
    errors.push('Phone number is required.');
  }
  if (body.email && typeof body.email === 'string' && body.email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      errors.push('Invalid email address format.');
    }
  }
  return errors;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  });
  res.end(JSON.stringify(payload));
}

/**
 * Node HTTP / Connect-compatible middleware for /api/customers CRUD backed by data/customers.json
 */
export async function handleCustomersApiRequest(req, res, projectRoot) {
  const urlPath = (req.url || '').split('?')[0];
  if (!urlPath.startsWith('/api/customers')) {
    return false;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    });
    res.end();
    return true;
  }

  const dbPath = path.join(projectRoot, 'data', 'customers.json');
  const idMatch = urlPath.match(/^\/api\/customers\/([^/]+)$/);
  const targetId = idMatch ? decodeURIComponent(idMatch[1]) : null;

  try {
    if (req.method === 'GET') {
      const customers = readCustomersDb(dbPath);
      if (targetId) {
        const found = customers.find((c) => c.id === targetId);
        if (!found) {
          sendJson(res, 404, { ok: false, error: 'Customer not found' });
          return true;
        }
        sendJson(res, 200, { ok: true, source: 'server-json-db', customer: found });
        return true;
      }
      sendJson(res, 200, { ok: true, source: 'server-json-db', customers });
      return true;
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const errors = validateCustomerPayload(body);
      if (errors.length > 0) {
        sendJson(res, 400, { ok: false, error: errors[0], errors });
        return true;
      }

      const customers = readCustomersDb(dbPath);
      const newCustomer = {
        id: 'cust-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        companyName: body.companyName.trim(),
        contactPerson: body.contactPerson.trim(),
        clientType: body.clientType,
        phone: body.phone.trim(),
        email: body.email ? String(body.email).trim() : '',
        wilayaCode: Number(body.wilayaCode) || 16,
        wilayaNameFr: String(body.wilayaNameFr || '16 - Alger'),
        wilayaNameAr: String(body.wilayaNameAr || '16 - الجزائر'),
        address: String(body.address || '').trim(),
        nif: body.nif ? String(body.nif).trim() : '',
        rc: body.rc ? String(body.rc).trim() : '',
        notes: body.notes ? String(body.notes).trim() : '',
        createdAt: new Date().toISOString(),
      };

      const nextCustomers = [newCustomer, ...customers];
      writeCustomersDb(dbPath, nextCustomers);
      sendJson(res, 201, { ok: true, source: 'server-json-db', customer: newCustomer, customers: nextCustomers });
      return true;
    }

    if (req.method === 'PUT' && targetId) {
      const body = await readJsonBody(req);
      const errors = validateCustomerPayload(body);
      if (errors.length > 0) {
        sendJson(res, 400, { ok: false, error: errors[0], errors });
        return true;
      }

      const customers = readCustomersDb(dbPath);
      const idx = customers.findIndex((c) => c.id === targetId);
      if (idx === -1) {
        sendJson(res, 404, { ok: false, error: 'Customer not found' });
        return true;
      }

      const updated = {
        ...customers[idx],
        companyName: body.companyName.trim(),
        contactPerson: body.contactPerson.trim(),
        clientType: body.clientType,
        phone: body.phone.trim(),
        email: body.email ? String(body.email).trim() : '',
        wilayaCode: Number(body.wilayaCode) || customers[idx].wilayaCode || 16,
        wilayaNameFr: String(body.wilayaNameFr || customers[idx].wilayaNameFr || ''),
        wilayaNameAr: String(body.wilayaNameAr || customers[idx].wilayaNameAr || ''),
        address: String(body.address || '').trim(),
        nif: body.nif ? String(body.nif).trim() : '',
        rc: body.rc ? String(body.rc).trim() : '',
        notes: body.notes ? String(body.notes).trim() : '',
        updatedAt: new Date().toISOString(),
      };

      const nextCustomers = [...customers];
      nextCustomers[idx] = updated;
      writeCustomersDb(dbPath, nextCustomers);
      sendJson(res, 200, { ok: true, source: 'server-json-db', customer: updated, customers: nextCustomers });
      return true;
    }

    if (req.method === 'DELETE' && targetId) {
      const customers = readCustomersDb(dbPath);
      const exists = customers.some((c) => c.id === targetId);
      if (!exists) {
        sendJson(res, 404, { ok: false, error: 'Customer not found' });
        return true;
      }
      const nextCustomers = customers.filter((c) => c.id !== targetId);
      writeCustomersDb(dbPath, nextCustomers);
      sendJson(res, 200, { ok: true, source: 'server-json-db', id: targetId, customers: nextCustomers });
      return true;
    }

    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return true;
  } catch (err) {
    sendJson(res, 500, {
      ok: false,
      error: err instanceof Error ? err.message : 'Server database error',
    });
    return true;
  }
}
