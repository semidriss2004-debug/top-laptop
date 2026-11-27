import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { handleCustomersApiRequest, readCustomersDb } from '../server/customersApi.js';

function createMockReqRes(method: string, url: string, bodyObj?: unknown) {
  const req = new EventEmitter() as any;
  req.method = method;
  req.url = url;

  let statusCode = 0;
  let rawBody = '';
  const res: any = {
    writeHead(code: number) {
      statusCode = code;
    },
    end(chunk?: string) {
      if (chunk) rawBody += chunk;
    },
  };

  setImmediate(() => {
    if (bodyObj !== undefined) {
      req.emit('data', JSON.stringify(bodyObj));
    }
    req.emit('end');
  });

  return { req, res, getStatus: () => statusCode, getJson: () => JSON.parse(rawBody) };
}

test('Server JSON DB API (/api/customers) executes real POST, GET, PUT, and DELETE persistence', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'top-laptop-cust-'));
  try {
    // 1. POST (Create customer)
    const postCall = createMockReqRes('POST', '/api/customers', {
      companyName: 'Magasin Constantine Tech',
      contactPerson: 'Bilal Toumi',
      clientType: 'shop',
      phone: '0551 99 88 77',
      email: 'bilal@ctech.dz',
      wilayaCode: 25,
      wilayaNameFr: '25 - Constantine',
      wilayaNameAr: '25 - قسنطينة',
      address: 'Cité Boussouf, Constantine',
      nif: '001925011223344',
      rc: '25/00-1122334B20',
      notes: 'Grossiste laptops',
    });
    const handledPost = await handleCustomersApiRequest(postCall.req, postCall.res, tmpDir);
    assert.equal(handledPost, true);
    assert.equal(postCall.getStatus(), 201);
    const createdId = postCall.getJson().customer.id;
    assert.ok(createdId.startsWith('cust-'));

    // Verify file exists on disk in data/customers.json
    const diskList = readCustomersDb(path.join(tmpDir, 'data', 'customers.json'));
    assert.equal(diskList.length, 1);
    assert.equal(diskList[0].companyName, 'Magasin Constantine Tech');

    // 2. GET (Read back after simulated refresh)
    const getCall = createMockReqRes('GET', '/api/customers');
    await handleCustomersApiRequest(getCall.req, getCall.res, tmpDir);
    assert.equal(getCall.getStatus(), 200);
    assert.equal(getCall.getJson().customers.length, 1);
    assert.equal(getCall.getJson().customers[0].contactPerson, 'Bilal Toumi');

    // 3. PUT (Update existing customer)
    const putCall = createMockReqRes('PUT', `/api/customers/${createdId}`, {
      companyName: 'SARL Constantine Tech Pro',
      contactPerson: 'Bilal Toumi',
      clientType: 'company',
      phone: '0770 99 88 77',
      email: 'bilal@ctech.dz',
      wilayaCode: 25,
      wilayaNameFr: '25 - Constantine',
      wilayaNameAr: '25 - قسنطينة',
      address: 'Nouvelle Ville Ali Mendjeli',
      nif: '001925011223344',
      rc: '25/00-1122334B20',
      notes: 'Client VIP',
    });
    await handleCustomersApiRequest(putCall.req, putCall.res, tmpDir);
    assert.equal(putCall.getStatus(), 200);
    assert.equal(putCall.getJson().customer.companyName, 'SARL Constantine Tech Pro');
    assert.equal(putCall.getJson().customer.clientType, 'company');

    // 4. Reject invalid POST missing required fields
    const invalidCall = createMockReqRes('POST', '/api/customers', {
      companyName: '',
      contactPerson: '',
      clientType: 'invalid',
      phone: '',
    });
    await handleCustomersApiRequest(invalidCall.req, invalidCall.res, tmpDir);
    assert.equal(invalidCall.getStatus(), 400);

    // 5. DELETE customer
    const delCall = createMockReqRes('DELETE', `/api/customers/${createdId}`);
    await handleCustomersApiRequest(delCall.req, delCall.res, tmpDir);
    assert.equal(delCall.getStatus(), 200);
    assert.equal(delCall.getJson().customers.length, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
