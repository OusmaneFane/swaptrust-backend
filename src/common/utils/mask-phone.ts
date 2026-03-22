export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone || phone.length < 8) return phone ?? null;
  const start = phone.slice(0, Math.min(6, phone.length - 4));
  return `${start}** **`;
}
