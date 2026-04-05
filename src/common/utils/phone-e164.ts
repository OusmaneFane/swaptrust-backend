/**
 * Normalise vers E.164 (+ et 8–15 chiffres) pour WhatsApp / SMS.
 * Accepte les formes courantes au Mali (223) et en Russie (7).
 */
export function normalizeToE164(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  let cleaned = trimmed.replace(/[^\d+]/g, '');
  if (!cleaned) return null;

  if (/^\+\d{8,15}$/.test(cleaned)) return cleaned;
  if (/^00\d{8,13}$/.test(cleaned)) return `+${cleaned.slice(2)}`;

  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (!/^\d+$/.test(digits)) return null;

  // Mali : +223 + 8 chiffres (mobiles : 5x–9x selon opérateurs — pas seulement 6x/7x)
  if (digits.length === 11 && digits.startsWith('223')) {
    return `+${digits}`;
  }
  if (digits.length === 8 && /^[5-9]\d{7}$/.test(digits)) {
    return `+223${digits}`;
  }
  if (digits.length === 9 && /^0[5-9]\d{7}$/.test(digits)) {
    return `+223${digits.slice(1)}`;
  }

  // Russie : +7 + 10 chiffres
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10 && /^9\d{9}$/.test(digits)) {
    return `+7${digits}`;
  }

  return null;
}
