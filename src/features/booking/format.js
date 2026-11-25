export function formatFcfa(n) {
  const v = Number(n)
  if (n === null || n === undefined || Number.isNaN(v)) return '—'
  const txt = new Intl.NumberFormat('fr-FR').format(Math.round(v)).replace(/[\u202f\u00a0]/g, '\u00a0')
  return `${txt}\u00a0FCFA`
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d)
}

export function formatDateCourte(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d)
}

export const plural = (n, un, plu) => `${n} ${Number(n) > 1 ? plu : un}`

// Nombre de jours (affichage seulement) entre deux dates ISO.
export function nbJours(debut, fin) {
  const a = new Date(debut).getTime()
  const b = new Date(fin).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.max(0, Math.round((b - a) / 86400000))
}

export const STATUS_LABELS = {
  pending: 'En attente de paiement',
  confirmed: 'Confirmée',
  ongoing: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  disputed: 'Litige en cours',
  expired: 'Expirée',
}

// « Expirée » = en attente dont le délai de 15 minutes est passé.
export function effectiveStatus(b, now = Date.now()) {
  if (b.status === 'pending' && b.expires_at && new Date(b.expires_at).getTime() <= now) return 'expired'
  return b.status
}

export const TABS = [
  { id: 'avenir', label: 'À venir', statuts: ['pending', 'confirmed'] },
  { id: 'encours', label: 'En cours', statuts: ['ongoing', 'disputed'] },
  { id: 'terminees', label: 'Terminées', statuts: ['completed'] },
  { id: 'annulees', label: 'Annulées', statuts: ['cancelled', 'expired'] },
]

export function tabOf(b, now = Date.now()) {
  const s = effectiveStatus(b, now)
  return (TABS.find((t) => t.statuts.includes(s)) || TABS[0]).id
}

// Contact WhatsApp seulement quand la réservation est payée (statut confirmé par la base).
export const PAYEES = ['confirmed', 'ongoing', 'completed']

export function whatsappLink(phone, texte) {
  let d = String(phone || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 8) d = `228${d}` // numéro togolais sans indicatif
  if (d.length < 8) return null
  return `https://wa.me/${d}${texte ? `?text=${encodeURIComponent(texte)}` : ''}`
}

export function msRestant(expiresAt, now = Date.now()) {
  if (!expiresAt) return null
  const t = new Date(expiresAt).getTime()
  return Number.isNaN(t) ? null : Math.max(0, t - now)
}

export function formatDecompte(ms) {
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export const DELIVERY_LABELS = {
  requested: 'Livraison demandée',
  assigned: 'Livreur trouvé',
  in_transit: 'Livraison en route',
  delivered: 'Livré',
  cancelled: 'Livraison annulée',
}
