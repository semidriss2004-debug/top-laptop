export const OFFICIAL_PHONE_LOCAL = '0557526420';
export const OFFICIAL_PHONE_DISPLAY = '0557 52 64 20';
export const OFFICIAL_PHONE_INTL = '+213557526420';
export const OFFICIAL_WHATSAPP_DIGITS = '213557526420';

const LEGACY_DEMO_NUMBERS = new Set([
  '+213555123456',
  '213555123456',
  '0555123456',
  '0555 12 34 56',
  '0555 12 34 56 / 0770 98 76 54',
  'https://wa.me/213555123456',
]);

/**
 * Checks if a stored phone/whatsapp value is still the old hardcoded demo placeholder
 */
export function isLegacyDemoPhone(val?: string | null): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  if (!trimmed) return true;
  if (LEGACY_DEMO_NUMBERS.has(trimmed)) return true;
  const digits = trimmed.replace(/[^0-9]/g, '');
  return digits === '213555123456' || digits === '0555123456' || digits === '05551234560770987654';
}

/**
 * Normalizes any Algerian or international phone number into pure digits for https://wa.me/<digits>
 * Examples:
 * - "0557526420" -> "213557526420"
 * - "0557 52 64 20" -> "213557526420"
 * - "+213 557 52 64 20" -> "213557526420"
 * - "00213557526420" -> "213557526420"
 */
export function formatWhatsAppNumber(rawPhone?: string | null): string {
  const source = rawPhone && rawPhone.trim() ? rawPhone.trim() : OFFICIAL_PHONE_LOCAL;
  // Take first phone number if separated by "/" or "|" or ","
  const primarySegment = source.split(/[\/|,]/)[0] || source;

  // Extract pure digits (works for raw phone numbers or pasted https://wa.me/213... URLs)
  let digits = primarySegment.replace(/[^0-9]/g, '');

  if (!digits) {
    return OFFICIAL_WHATSAPP_DIGITS;
  }

  if (digits.startsWith('00213')) {
    digits = '213' + digits.slice(5);
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length >= 9 && digits.length <= 10) {
    digits = '213' + digits.slice(1);
  } else if (digits.length === 9 && /^[2-9]/.test(digits)) {
    digits = '213' + digits;
  }

  // Also guard if someone entered "2130557526420" (with extra 0 after 213)
  if (digits.startsWith('2130') && digits.length === 13) {
    digits = '213' + digits.slice(4);
  }

  return digits || OFFICIAL_WHATSAPP_DIGITS;
}

/**
 * Builds a valid https://wa.me/ URL with optional pre-filled message
 */
export function buildWhatsAppUrl(rawPhone?: string | null, message?: string): string {
  const cleanDigits = formatWhatsAppNumber(rawPhone);
  const baseUrl = `https://wa.me/${cleanDigits}`;
  if (message && message.trim().length > 0) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

/**
 * Formats a phone number for direct `tel:` links
 * Examples:
 * - "0557 52 64 20" -> "tel:0557526420"
 * - "+213 557 52 64 20" -> "tel:+213557526420"
 */
export function buildTelUrl(rawPhone?: string | null): string {
  const source = rawPhone && rawPhone.trim() ? rawPhone.trim() : OFFICIAL_PHONE_LOCAL;
  const primarySegment = (source.split(/[\/|,]/)[0] || source).trim();
  const hasPlus = primarySegment.startsWith('+');
  const digits = primarySegment.replace(/[^0-9]/g, '');
  if (!digits) {
    return `tel:${OFFICIAL_PHONE_LOCAL}`;
  }
  return `tel:${hasPlus ? '+' : ''}${digits}`;
}

/**
 * Ensures external social media links always have a valid protocol (https://)
 */
export function normalizeExternalUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#') return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}
