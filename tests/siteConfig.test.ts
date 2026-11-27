import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_SITE_CONFIG,
  getEffectiveSiteConfig,
  saveSiteConfigToStorage,
  SITE_CONFIG_STORAGE_KEY,
  siteConfigToStoreSettingsPatch,
} from '../src/config/siteConfig';
import { buildTelUrl, buildWhatsAppUrl } from '../src/utils/contactLinks';

// Minimal localStorage polyfill for Node test environment
function installMockLocalStorage() {
  const store = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    },
  };
  return store;
}

test('Central siteConfig persists modified phone, WhatsApp, Instagram, and Facebook across reload', () => {
  const store = installMockLocalStorage();

  const saved = saveSiteConfigToStorage({
    phone: '0770 11 22 33',
    whatsappNumber: '0770 11 22 33',
    facebook: 'facebook.com/toplaptop.new',
    instagram: 'https://instagram.com/toplaptop.new',
  });

  assert.equal(saved.phone, '0770 11 22 33');
  assert.equal(saved.whatsappUrl, 'https://wa.me/213770112233');
  assert.equal(saved.facebook, 'https://facebook.com/toplaptop.new');
  assert.equal(saved.instagram, 'https://instagram.com/toplaptop.new');
  assert.ok(store.has(SITE_CONFIG_STORAGE_KEY));

  // Simulate fresh reload reading from central storage
  const reloaded = getEffectiveSiteConfig();
  assert.equal(reloaded.phone, '0770 11 22 33');
  assert.equal(reloaded.whatsappUrl, 'https://wa.me/213770112233');
  assert.equal(reloaded.facebook, 'https://facebook.com/toplaptop.new');
  assert.equal(reloaded.instagram, 'https://instagram.com/toplaptop.new');

  // Verify tel: and wa.me URL builders respect even custom/demo-looking numbers
  assert.equal(buildTelUrl('0555 12 34 56'), 'tel:0555123456');
  assert.equal(buildWhatsAppUrl('0555 12 34 56'), 'https://wa.me/213555123456');
  assert.notEqual(reloaded.phone, DEFAULT_SITE_CONFIG.phone);

  const patch = siteConfigToStoreSettingsPatch(reloaded);
  assert.equal(patch.contactPhone, '0770 11 22 33');
  assert.equal(patch.socialLinks?.facebook, 'https://facebook.com/toplaptop.new');
  assert.equal(patch.socialLinks?.instagram, 'https://instagram.com/toplaptop.new');
});
