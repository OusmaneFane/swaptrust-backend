/** Priorité phoneMali puis phoneRussia pour WhatsApp. */
export function clientWhatsappPhone(user: {
  phoneMali?: string | null;
  phoneRussia?: string | null;
}): string {
  return user.phoneMali?.trim() || user.phoneRussia?.trim() || '';
}
