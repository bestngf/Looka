// Formats français : prix en FCFA (XOF), dates, mois.

export function fcfa(valeur) {
  const n = Number(valeur);
  if (!Number.isFinite(n)) return '—';
  const texte = new Intl.NumberFormat('fr-FR').format(Math.round(n));
  return texte.replace(/[\u202f\u00a0]/g, ' ') + ' FCFA';
}

function versDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dateCourte(iso) {
  const d = versDate(iso);
  return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
}

export function heureCourte(iso) {
  const d = versDate(iso);
  return d
    ? d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';
}

export function cleMois(iso) {
  const d = versDate(iso);
  if (!d) return 'inconnu';
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

export function titreMois(cle) {
  if (cle === 'inconnu') return 'Date inconnue';
  const [annee, mois] = cle.split('-').map(Number);
  const texte = new Date(annee, mois - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

// Lien WhatsApp : on garde les chiffres ; un numéro à 8 chiffres reçoit l'indicatif du Togo (228).
export function lienWhatsApp(telephone) {
  const chiffres = String(telephone || '').replace(/\D/g, '');
  if (!chiffres) return null;
  const complet = chiffres.length === 8 ? '228' + chiffres : chiffres;
  return 'https://wa.me/' + complet;
}

export const LIBELLES_ANNONCE = {
  draft: 'Brouillon',
  pending_review: 'En validation',
  published: 'En ligne',
  paused: 'En pause',
  rejected: 'Refusée',
  archived: 'Archivée',
};

export const LIBELLES_RESERVATION = {
  pending: 'En attente de paiement',
  confirmed: 'Confirmée',
  ongoing: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  disputed: 'Litige en cours',
};

export const ETATS_MATERIEL = [
  { valeur: 'new', libelle: 'Neuf' },
  { valeur: 'like_new', libelle: 'Comme neuf' },
  { valeur: 'good', libelle: 'Bon état' },
  { valeur: 'fair', libelle: 'État correct' },
];
