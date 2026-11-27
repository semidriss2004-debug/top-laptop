import type { StoreSettings } from '../types';
import { buildWhatsAppUrl, normalizeExternalUrl } from '../utils/contactLinks';

export const SITE_CONFIG_STORAGE_KEY = 'top_laptop_site_config_v1';

export interface SiteContactConfig {
  storeName: string;
  phone: string;
  whatsappNumber: string;
  whatsappUrl: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  updatedAt?: number;
}

/**
 * Single source of truth for default TOP LAPTOP contact & social settings.
 * All components read from the central siteConfig helper instead of hardcoding values.
 */
export const DEFAULT_SITE_CONFIG: SiteContactConfig = {
  storeName: 'TOP LAPTOP ALGERIE',
  phone: '0557526420',
  whatsappNumber: '0557526420',
  whatsappUrl: 'https://wa.me/213557526420',
  email: 'contact@toplaptop-dz.com',
  address: '15 Rue Didouche Mourad, Alger Centre, Alger, Algérie',
  facebook: 'https://facebook.com/toplaptop.dz',
  instagram: 'https://instagram.com/toplaptop.dz',
  tiktok: 'https://tiktok.com/@toplaptop.dz',
  youtube: 'https://youtube.com/@toplaptopdz',
  linkedin: 'https://linkedin.com/company/top-laptop-dz',
};

function sanitizeSocialField(val: unknown, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (trimmed === '') return '';
  return normalizeExternalUrl(trimmed) || '';
}

function normalizeWhatsAppInput(inputNumberOrUrl?: string | null, fallbackPhone?: string): {
  whatsappNumber: string;
  whatsappUrl: string;
} {
  const raw = (inputNumberOrUrl ?? '').trim();
  const base = raw || (fallbackPhone ?? DEFAULT_SITE_CONFIG.whatsappNumber);
  const url = buildWhatsAppUrl(base);
  // If user pasted a wa.me link, extract digits or clean display, otherwise keep their formatted number
  const display = raw.toLowerCase().includes('wa.me/')
    ? base.replace(/^https?:\/\/(www\.)?wa\.me\//i, '').split('?')[0] || base
    : base;
  return { whatsappNumber: display, whatsappUrl: url };
}

export function loadPersistedSiteConfig(): SiteContactConfig | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(SITE_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SiteContactConfig>;
    if (!parsed || typeof parsed !== 'object') return null;

    const phone =
      typeof parsed.phone === 'string' && parsed.phone.trim()
        ? parsed.phone.trim()
        : DEFAULT_SITE_CONFIG.phone;

    const { whatsappNumber, whatsappUrl } = normalizeWhatsAppInput(
      parsed.whatsappNumber || parsed.whatsappUrl,
      phone
    );

    return {
      storeName:
        typeof parsed.storeName === 'string' && parsed.storeName.trim()
          ? parsed.storeName.trim()
          : DEFAULT_SITE_CONFIG.storeName,
      phone,
      whatsappNumber,
      whatsappUrl,
      email:
        typeof parsed.email === 'string'
          ? parsed.email.trim()
          : DEFAULT_SITE_CONFIG.email,
      address:
        typeof parsed.address === 'string' && parsed.address.trim()
          ? parsed.address.trim()
          : DEFAULT_SITE_CONFIG.address,
      facebook: sanitizeSocialField(parsed.facebook, DEFAULT_SITE_CONFIG.facebook),
      instagram: sanitizeSocialField(parsed.instagram, DEFAULT_SITE_CONFIG.instagram),
      tiktok: sanitizeSocialField(parsed.tiktok, DEFAULT_SITE_CONFIG.tiktok),
      youtube: sanitizeSocialField(parsed.youtube, DEFAULT_SITE_CONFIG.youtube),
      linkedin: sanitizeSocialField(parsed.linkedin, DEFAULT_SITE_CONFIG.linkedin),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
    };
  } catch {
    return null;
  }
}

export function saveSiteConfigToStorage(patch: Partial<SiteContactConfig>): SiteContactConfig {
  const current = loadPersistedSiteConfig() || { ...DEFAULT_SITE_CONFIG };
  const nextPhone =
    patch.phone !== undefined
      ? patch.phone.trim() || current.phone || DEFAULT_SITE_CONFIG.phone
      : current.phone;

  const { whatsappNumber, whatsappUrl } = normalizeWhatsAppInput(
    patch.whatsappNumber !== undefined
      ? patch.whatsappNumber
      : patch.whatsappUrl !== undefined
      ? patch.whatsappUrl
      : current.whatsappNumber,
    nextPhone
  );

  const next: SiteContactConfig = {
    storeName:
      patch.storeName !== undefined
        ? patch.storeName.trim() || DEFAULT_SITE_CONFIG.storeName
        : current.storeName,
    phone: nextPhone,
    whatsappNumber,
    whatsappUrl,
    email: patch.email !== undefined ? patch.email.trim() : current.email,
    address: patch.address !== undefined ? patch.address.trim() : current.address,
    facebook:
      patch.facebook !== undefined
        ? sanitizeSocialField(patch.facebook, '')
        : current.facebook,
    instagram:
      patch.instagram !== undefined
        ? sanitizeSocialField(patch.instagram, '')
        : current.instagram,
    tiktok:
      patch.tiktok !== undefined ? sanitizeSocialField(patch.tiktok, '') : current.tiktok,
    youtube:
      patch.youtube !== undefined ? sanitizeSocialField(patch.youtube, '') : current.youtube,
    linkedin:
      patch.linkedin !== undefined
        ? sanitizeSocialField(patch.linkedin, '')
        : current.linkedin,
    updatedAt: Date.now(),
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }

  return next;
}

/**
 * Resolves the live central SiteContactConfig by prioritizing live StoreSettings
 * (when provided), then persisted local siteConfig, then DEFAULT_SITE_CONFIG.
 */
export function getEffectiveSiteConfig(settings?: Partial<StoreSettings> | null): SiteContactConfig {
  const persisted = loadPersistedSiteConfig();

  if (!settings) {
    return persisted || DEFAULT_SITE_CONFIG;
  }

  const phone =
    (settings.contactPhone && settings.contactPhone.trim()) ||
    (settings.whatsappNumber && settings.whatsappNumber.trim()) ||
    persisted?.phone ||
    DEFAULT_SITE_CONFIG.phone;

  const { whatsappNumber, whatsappUrl } = normalizeWhatsAppInput(
    settings.whatsappNumber || settings.socialLinks?.whatsapp || persisted?.whatsappNumber,
    phone
  );

  const social = settings.socialLinks;

  return {
    storeName: (settings.storeName && settings.storeName.trim()) || persisted?.storeName || DEFAULT_SITE_CONFIG.storeName,
    phone,
    whatsappNumber,
    whatsappUrl,
    email:
      settings.contactEmail !== undefined
        ? settings.contactEmail.trim()
        : persisted?.email ?? DEFAULT_SITE_CONFIG.email,
    address:
      settings.storeAddress !== undefined
        ? settings.storeAddress.trim()
        : persisted?.address ?? DEFAULT_SITE_CONFIG.address,
    facebook:
      social && 'facebook' in social
        ? sanitizeSocialField(social.facebook, '')
        : persisted?.facebook ?? DEFAULT_SITE_CONFIG.facebook,
    instagram:
      social && 'instagram' in social
        ? sanitizeSocialField(social.instagram, '')
        : persisted?.instagram ?? DEFAULT_SITE_CONFIG.instagram,
    tiktok:
      social && 'tiktok' in social
        ? sanitizeSocialField(social.tiktok, '')
        : persisted?.tiktok ?? DEFAULT_SITE_CONFIG.tiktok,
    youtube:
      social && 'youtube' in social
        ? sanitizeSocialField(social.youtube, '')
        : persisted?.youtube ?? DEFAULT_SITE_CONFIG.youtube,
    linkedin:
      social && 'linkedin' in social
        ? sanitizeSocialField(social.linkedin, '')
        : persisted?.linkedin ?? DEFAULT_SITE_CONFIG.linkedin,
    updatedAt: persisted?.updatedAt,
  };
}

export function siteConfigToStoreSettingsPatch(cfg: SiteContactConfig): Partial<StoreSettings> {
  return {
    storeName: cfg.storeName,
    contactPhone: cfg.phone,
    whatsappNumber: cfg.whatsappNumber,
    contactEmail: cfg.email,
    storeAddress: cfg.address,
    socialLinks: {
      facebook: cfg.facebook,
      instagram: cfg.instagram,
      tiktok: cfg.tiktok,
      youtube: cfg.youtube,
      linkedin: cfg.linkedin,
      whatsapp: cfg.whatsappUrl,
    },
  };
}
