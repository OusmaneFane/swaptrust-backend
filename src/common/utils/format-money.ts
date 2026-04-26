/** Montants en plus petite unité (centimes CFA / kopecks RUB). */
export function formatCFA(centimes: number): string {
  const v = centimes / 100;
  // fr-FR utilise souvent des espaces insécables (U+00A0 / U+202F) comme séparateurs de milliers,
  // qui peuvent s'afficher comme des caractères bizarres (ex: "/") sur certains clients (WhatsApp).
  const n = v
    .toLocaleString('fr-FR', { maximumFractionDigits: 0 })
    .replace(/[\u00A0\u202F]/g, ' ');
  return `${n} F CFA`;
}

export function formatRUB(kopecks: number): string {
  const v = kopecks / 100;
  const n = v
    .toLocaleString('fr-FR', { maximumFractionDigits: 0 })
    .replace(/[\u00A0\u202F]/g, ' ');
  return `${n} ₽`;
}
