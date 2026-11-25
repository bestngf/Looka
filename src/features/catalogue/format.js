export function formatFcfa(n) {
  const v = Number(n);
  if (n === null || n === undefined || Number.isNaN(v)) return '—';
  const txt = new Intl.NumberFormat('fr-FR').format(Math.round(v)).replace(/[\u202f\u00a0]/g, '\u00a0');
  return `${txt}\u00a0FCFA`;
}

export const CONDITIONS = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'État correct',
};

export function formatNote(n) {
  const v = Number(n);
  return Number.isNaN(v) ? '' : v.toFixed(1).replace('.', ',');
}

export function plural(n, un, plu) {
  return `${n} ${Number(n) > 1 ? plu : un}`;
}
