import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PHOTOS_BUCKET } from '../../config'

export function fcfa(n) {
  const v = Number(n)
  if (n === null || n === undefined || Number.isNaN(v)) return '—'
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(v)).replace(/[  ]/g, ' ')} FCFA`
}

export function dateHeure(iso) {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d)
}

export function messageErreur(err, defaut = "Quelque chose s'est mal passé. Réessaie dans un instant.") {
  const m = String(err?.message || err || '')
  if (/failed to fetch|network|load failed/i.test(m)) return 'Pas de connexion. Vérifie ton réseau puis réessaie.'
  if (/jwt|permission|row-level|policy|denied|forbidden/i.test(m)) return "Tu n'as pas l'autorisation de faire cela. Reconnecte-toi puis réessaie."
  // Les fonctions de la base renvoient déjà des phrases en français : on les montre.
  if (/[àâéèêëîïôùûç]/i.test(m) && m.length < 160) return m
  return defaut
}

export function useLoad(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let vivant = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => vivant && setState({ data, loading: false, error: null }))
      .catch((error) => vivant && setState({ data: null, loading: false, error }))
    return () => { vivant = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return { ...state, reload: () => setTick((t) => t + 1) }
}

export function photoUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl
}

// Numéro togolais à 8 chiffres : on ajoute l'indicatif 228.
export function lienWhatsApp(tel) {
  const n = String(tel || '').replace(/\D/g, '')
  if (!n) return null
  return `https://wa.me/${n.length === 8 ? '228' + n : n}`
}
export function lienAppel(tel) {
  const n = String(tel || '').replace(/[^\d+]/g, '')
  return n ? `tel:${n}` : null
}
