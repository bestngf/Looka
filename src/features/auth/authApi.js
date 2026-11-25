import { supabase } from '../../lib/supabase'
import { SUPABASE_URL, SUPABASE_ANON_KEY, EMAIL_DOMAIN } from '../../config'

const HEADERS = { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY }
const NET = 'Pas de connexion internet. Vérifie ton réseau et réessaie.'

async function post(fn, body) {
  let res
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) })
  } catch {
    throw new Error(NET)
  }
  let data = {}
  try { data = await res.json() } catch { /* réponse vide */ }
  return { ok: res.ok, data }
}

export const cleanUsername = (u) => (u || '').trim().toLowerCase()
export const isUsernameValid = (u) => /^[a-z0-9._-]{3,30}$/.test(u)

export async function checkUsername(username) {
  const { data } = await post('lokaa-signup', { username, check_only: true })
  if (typeof data.available !== 'boolean') throw new Error("Impossible de vérifier l'identifiant. Réessaie.")
  return data.available
}

export async function signUp(payload) {
  const { ok, data } = await post('lokaa-signup', payload)
  if (!ok || data.error) {
    const e = String(data.error || '')
    if (/taken|exist|pris|duplicate/i.test(e)) throw new Error('Cet identifiant est déjà pris.')
    throw new Error("L'inscription n'a pas pu se faire. Vérifie les infos et réessaie.")
  }
}

export async function login(username, code) {
  const { error } = await supabase.auth.signInWithPassword({ email: cleanUsername(username) + EMAIL_DOMAIN, password: code })
  if (error) throw new Error('Identifiant ou code incorrect.')
}

export async function forgotCode(username, email) {
  const { data } = await post('lokaa-code-oublie', { username, email })
  if (data.ok === false && data.error === 'mail_non_configure') {
    throw new Error("La récupération par e-mail n'est pas encore activée")
  }
  if (data.ok === false) throw new Error("Cette demande n'a pas pu aboutir. Vérifie l'identifiant et l'e-mail.")
}
