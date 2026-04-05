/** Montants en plus petite unité (centimes CFA / kopecks RUB). */
export function formatCFA(centimes: number): string {
  const v = centimes / 100;
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F CFA`;
}

export function formatRUB(kopecks: number): string {
  const v = kopecks / 100;
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ₽`;
}
