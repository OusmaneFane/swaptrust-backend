/** Priorité phone (générique) puis phoneMali puis phoneRussia pour WhatsApp. */
export function clientWhatsappPhone(user: {
  phone?: string | null;
  phoneMali?: string | null;
  phoneRussia?: string | null;
}): string {
  return (
    user.phone?.trim() ||
    user.phoneMali?.trim() ||
    user.phoneRussia?.trim() ||
    ''
  );
}
