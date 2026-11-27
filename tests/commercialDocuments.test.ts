import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConvertedDraft,
  buildDraftFromOrder,
  createDefaultDocumentSettings,
  generateNextDocumentNumber,
  getDefaultDocPermissionsForRole,
  getPermissionForDocType,
  migrateEmployeesDocPermissions,
  numberToFrenchWordsDZD,
  recalculateDocumentTotals,
  reconcileFacturesWithReceipts,
  validateCommercialDocumentInput,
} from '../src/utils/commercialDocuments';
import type { CommercialDocument, Employee, Order } from '../src/types';

const sampleOrder: Order = {
  id: 'TL-8941',
  bonDeLivraisonRef: 'BL-2026-8941',
  customerName: 'Mohamed Amine Larbi',
  customerPhone: '0555 44 33 22',
  wilaya: { code: 16, nameFr: '16 - Alger', nameAr: '16 - الجزائر' },
  commune: { nameFr: 'Hydra', nameAr: 'حيدرة' },
  address: '12 Boulevard des Martyrs, Hydra',
  deliveryCompanyId: 'yalidine',
  deliveryCompanyName: 'Yalidine Express',
  deliveryMethod: 'home',
  shippingTrackingNumber: 'YAL-8941-DZ',
  items: [
    {
      productId: 'tl-rog-strix-g16',
      sku: 'TL-ASUS-G16-4070-01',
      barcode: '6931234560012',
      name: 'ASUS ROG Strix G16 (2024)',
      priceDZD: 245000,
      purchasePriceDZD: 215000,
      quantity: 1,
      image: '',
    },
  ],
  subtotalDZD: 245000,
  deliveryFeeDZD: 550,
  totalDZD: 245550,
  totalPurchaseCostDZD: 215000,
  netProfitDZD: 30000,
  paymentMethod: 'cod',
  paymentStatus: 'pending',
  status: 'shipped',
  statusHistory: [],
  notes: 'Appeler avant livraison',
  createdAt: '2026-11-20T10:00:00.000Z',
};

test('French number-to-words converter handles Algerian DZD amounts accurately', () => {
  assert.equal(numberToFrenchWordsDZD(0), 'Zéro Dinar Algérien');
  assert.equal(numberToFrenchWordsDZD(80), 'Quatre-vingts Dinars Algériens');
  assert.equal(numberToFrenchWordsDZD(71), 'Soixante et onze Dinars Algériens');
  assert.equal(
    numberToFrenchWordsDZD(245550),
    'Deux cent quarante-cinq mille cinq cent cinquante Dinars Algériens'
  );
  assert.equal(
    numberToFrenchWordsDZD(1500.5),
    'Mille cinq cents Dinars Algériens et cinquante centimes'
  );
});

test('Document totals support 0% and 19% TVA plus configurable stamp duty', () => {
  const settings = createDefaultDocumentSettings();
  const baseLine = {
    id: 'l1',
    productName: 'ThinkPad X1',
    quantity: 2,
    unitPriceDZD: 100000,
    discountDZD: 10000,
    lineTotalDZD: 190000,
  };

  const zeroTva = recalculateDocumentTotals({
    lines: [baseLine],
    tvaRate: 0,
    deliveryFeeDZD: 500,
    applyTimbre: false,
    settings,
    type: 'facture',
  });
  assert.equal(zeroTva.netHtDZD, 190000);
  assert.equal(zeroTva.tvaAmountDZD, 0);
  assert.equal(zeroTva.timbreAmountDZD, 0);
  assert.equal(zeroTva.totalDZD, 190500);

  const withTvaAndTimbre = recalculateDocumentTotals({
    lines: [baseLine],
    tvaRate: 19,
    deliveryFeeDZD: 500,
    applyTimbre: true,
    settings: { ...settings, timbreRatePercent: 1, timbreMinDZD: 5, timbreMaxDZD: 2500 },
    type: 'facture',
  });
  assert.equal(withTvaAndTimbre.tvaAmountDZD, 36100);
  // Base before timbre = 190000 + 36100 + 500 = 226600; 1% = 2266 (<= 2500 max)
  assert.equal(withTvaAndTimbre.timbreAmountDZD, 2266);
  assert.equal(withTvaAndTimbre.totalDZD, 228866);
});

test('Full flow: Order -> Proforma -> Facture -> BL -> Partial Receipt -> Full Receipt -> Cancel Receipt', () => {
  let settings = createDefaultDocumentSettings();
  let docs: CommercialDocument[] = [];
  const year = 2026;

  // 1. Order -> Proforma (Draft -> Issued)
  const proDraft = buildDraftFromOrder(sampleOrder, 'proforma', settings, docs);
  const proSeq = generateNextDocumentNumber('proforma', year, settings, docs);
  assert.equal(proSeq.number, 'PRO-2026-0001');
  const proforma: CommercialDocument = {
    ...proDraft,
    id: 'doc-pro-1',
    number: proSeq.number,
    year,
    sequenceNumber: proSeq.sequenceNumber,
    status: 'issued',
    createdAt: '2026-11-20T10:05:00.000Z',
  };
  assert.deepEqual(validateCommercialDocumentInput(proforma, docs), []);
  docs = [proforma, ...docs];
  settings = { ...settings, counters: { ...settings.counters, proforma_2026: proSeq.nextCounterValue } };

  // 2. Proforma -> Facture
  const facDraft = buildConvertedDraft(proforma, 'facture', settings);
  const facSeq = generateNextDocumentNumber('facture', year, settings, docs);
  assert.equal(facSeq.number, 'FAC-2026-0001');
  const facture: CommercialDocument = {
    ...facDraft,
    id: 'doc-fac-1',
    number: facSeq.number,
    year,
    sequenceNumber: facSeq.sequenceNumber,
    status: 'issued',
    amountPaidDZD: 0,
    remainingAmountDZD: facDraft.totalDZD,
    createdAt: '2026-11-20T10:10:00.000Z',
  };
  assert.equal(facture.sourceDocumentNumber, 'PRO-2026-0001');
  assert.equal(facture.orderId, 'TL-8941');
  assert.equal(facture.totalDZD, 245550);
  docs = [facture, ...docs];
  settings = { ...settings, counters: { ...settings.counters, facture_2026: facSeq.nextCounterValue } };

  // Immutability check: editing an issued Facture must fail validation
  const editErrors = validateCommercialDocumentInput({ ...facture, totalDZD: 1000 }, docs, { isEdit: true });
  assert.ok(editErrors.some((e) => e.includes('ne peut pas être modifié')));

  // 3. Facture -> BL (with prices hidden toggle & tracking)
  const blDraft = buildConvertedDraft(facture, 'bl', settings);
  const blSeq = generateNextDocumentNumber('bl', year, settings, docs);
  assert.equal(blSeq.number, 'BL-2026-0001');
  const bl: CommercialDocument = {
    ...blDraft,
    id: 'doc-bl-1',
    number: blSeq.number,
    year,
    sequenceNumber: blSeq.sequenceNumber,
    status: 'prepared',
    blShowPrices: false,
    deliveryCompanyName: 'Yalidine Express',
    trackingNumber: 'YAL-8941-DZ',
    createdAt: '2026-11-20T10:15:00.000Z',
  };
  assert.equal(bl.linkedFactureNumber, 'FAC-2026-0001');
  assert.deepEqual(validateCommercialDocumentInput(bl, docs), []);
  docs = [bl, ...docs];
  settings = { ...settings, counters: { ...settings.counters, bl_2026: blSeq.nextCounterValue } };

  // 4. Facture -> Partial Payment Receipt #1 (Cash 100,000 DZD)
  const rec1Draft = buildConvertedDraft(facture, 'receipt', settings);
  const rec1Seq = generateNextDocumentNumber('receipt', year, settings, docs);
  assert.equal(rec1Seq.number, 'REC-2026-0001');
  const rec1: CommercialDocument = {
    ...rec1Draft,
    id: 'doc-rec-1',
    number: rec1Seq.number,
    year,
    sequenceNumber: rec1Seq.sequenceNumber,
    status: 'paid',
    paymentMethod: 'cash',
    paymentAmountDZD: 100000,
    totalDZD: 100000,
    createdAt: '2026-11-20T10:20:00.000Z',
  };
  assert.deepEqual(validateCommercialDocumentInput(rec1, docs), []);
  docs = reconcileFacturesWithReceipts([rec1, ...docs]);
  settings = { ...settings, counters: { ...settings.counters, receipt_2026: rec1Seq.nextCounterValue } };

  const facAfterPartial = docs.find((d) => d.id === 'doc-fac-1')!;
  assert.equal(facAfterPartial.amountPaidDZD, 100000);
  assert.equal(facAfterPartial.remainingAmountDZD, 145550);
  assert.equal(facAfterPartial.status, 'partial');

  // 5. Reject overpayment receipt & invalid cheque details
  const rec2Seq = generateNextDocumentNumber('receipt', year, settings, docs);
  assert.equal(rec2Seq.number, 'REC-2026-0002');
  const overpayAttempt: CommercialDocument = {
    ...rec1,
    id: 'doc-rec-over',
    number: rec2Seq.number,
    sequenceNumber: rec2Seq.sequenceNumber,
    paymentAmountDZD: 200000,
    totalDZD: 200000,
  };
  const overpayErrors = validateCommercialDocumentInput(overpayAttempt, docs);
  assert.ok(overpayErrors.some((e) => e.includes('dépasse le solde restant')));

  const missingChequeErrors = validateCommercialDocumentInput(
    {
      ...overpayAttempt,
      paymentAmountDZD: 145550,
      totalDZD: 145550,
      paymentMethod: 'cheque',
      paymentMethodDetails: {},
    },
    docs
  );
  assert.ok(missingChequeErrors.some((e) => e.includes('chèque')));

  // 6. Full Payment Receipt #2 (Bank Transfer 145,550 DZD)
  const rec2: CommercialDocument = {
    ...rec1Draft,
    id: 'doc-rec-2',
    number: rec2Seq.number,
    year,
    sequenceNumber: rec2Seq.sequenceNumber,
    status: 'paid',
    paymentMethod: 'bank_transfer',
    paymentMethodDetails: { transferRef: 'VIR-9988', bankName: 'BNA' },
    paymentAmountDZD: 145550,
    totalDZD: 145550,
    createdAt: '2026-11-20T10:25:00.000Z',
  };
  assert.deepEqual(validateCommercialDocumentInput(rec2, docs), []);
  docs = reconcileFacturesWithReceipts([rec2, ...docs]);

  const facAfterFull = docs.find((d) => d.id === 'doc-fac-1')!;
  assert.equal(facAfterFull.amountPaidDZD, 245550);
  assert.equal(facAfterFull.remainingAmountDZD, 0);
  assert.equal(facAfterFull.status, 'paid');

  // 7. Duplicate number must be blocked even if counter was reset
  const resetSettings = { ...settings, counters: { ...settings.counters, facture_2026: 0 } };
  const nextFacSeq = generateNextDocumentNumber('facture', year, resetSettings, docs);
  assert.equal(nextFacSeq.number, 'FAC-2026-0002');

  // 8. Cancelling Receipt #2 reverts Facture back to partial
  docs = reconcileFacturesWithReceipts(
    docs.map((d) => (d.id === 'doc-rec-2' ? { ...d, status: 'cancelled' } : d))
  );
  const facAfterCancel = docs.find((d) => d.id === 'doc-fac-1')!;
  assert.equal(facAfterCancel.amountPaidDZD, 100000);
  assert.equal(facAfterCancel.remainingAmountDZD, 145550);
  assert.equal(facAfterCancel.status, 'partial');
});

test('RBAC role permissions restrict Cashier to Receipts and Delivery Manager to BLs', () => {
  const cashierPerms = getDefaultDocPermissionsForRole('CASHIER');
  assert.ok(cashierPerms.includes('issue_receipt'));
  assert.ok(!cashierPerms.includes('issue_facture'));
  assert.ok(!cashierPerms.includes('issue_bl'));
  assert.ok(!cashierPerms.includes('manage_document_settings'));

  const deliveryPerms = getDefaultDocPermissionsForRole('DELIVERY_MANAGER');
  assert.ok(deliveryPerms.includes('issue_bl'));
  assert.ok(!deliveryPerms.includes('issue_receipt'));
  assert.ok(!deliveryPerms.includes('issue_facture'));

  assert.equal(getPermissionForDocType('receipt'), 'issue_receipt');
  assert.equal(getPermissionForDocType('bl'), 'issue_bl');

  const legacyDeliveryEmp: Employee = {
    id: 'emp-del',
    name: 'Legacy Delivery',
    email: 'del@toplaptop.dz',
    role: 'DELIVERY_MANAGER',
    isActive: true,
    passcode: '123',
    customPermissions: ['manage_delivery', 'manage_orders'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const { employees: migrated, changed } = migrateEmployeesDocPermissions([legacyDeliveryEmp]);
  assert.equal(changed, true);
  assert.ok(migrated[0].customPermissions.includes('issue_bl'));
  assert.ok(!migrated[0].customPermissions.includes('issue_facture'));
});
