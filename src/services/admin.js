// Espace équipe LOKAA. Les droits sont décidés par la base (ngf_is_admin) : l'écran ne fait que demander.
import { supabase } from '../lib/supabase'

const verifier = ({ data, error }) => { if (error) throw error; return data }

export async function suisAdmin() {
  const { data, error } = await supabase.rpc('ngf_is_admin')
  if (error) throw error
  return data === true
}

async function profils(ids) {
  const liste = [...new Set(ids.filter(Boolean))]
  if (!liste.length) return {}
  const rows = verifier(await supabase.from('lokaa_profiles').select('id, full_name, phone, city').in('id', liste)) || []
  return Object.fromEntries(rows.map((p) => [p.id, p]))
}

export async function annoncesAValider() {
  const rows = verifier(await supabase.from('lokaa_listings').select('*').eq('status', 'pending_review').order('created_at', { ascending: true })) || []
  if (!rows.length) return []
  const media = verifier(await supabase.from('lokaa_listing_media').select('listing_id, media_url, position').in('listing_id', rows.map((r) => r.id)).order('position', { ascending: true })) || []
  const pro = await profils(rows.map((r) => r.owner_id))
  return rows.map((r) => ({ ...r, _photos: media.filter((m) => m.listing_id === r.id).map((m) => m.media_url), _proprio: pro[r.owner_id] || null }))
}

export const decisionAnnonce = async (id, decision, note) =>
  verifier(await supabase.rpc('lokaa_admin_annonce', { p_listing: id, p_decision: decision, p_note: note || null }))

export async function litiges() {
  const rows = verifier(await supabase.from('lokaa_bookings').select('*').eq('status', 'disputed').order('updated_at', { ascending: true })) || []
  if (!rows.length) return []
  const insp = verifier(await supabase.from('lokaa_inspections').select('booking_id, inspection_stage, condition_notes, photo_urls, created_at').in('booking_id', rows.map((r) => r.id)).order('created_at', { ascending: true })) || []
  const pro = await profils(rows.flatMap((r) => [r.owner_id, r.customer_id]))
  return rows.map((r) => ({ ...r, _controles: insp.filter((i) => i.booking_id === r.id), _proprio: pro[r.owner_id] || null, _client: pro[r.customer_id] || null }))
}

export const trancherLitige = async (id, retenue) =>
  verifier(await supabase.rpc('lokaa_admin_resoudre', { p_booking: id, p_retenue: retenue }))

export async function versementsAFaire() {
  const rows = verifier(await supabase.from('lokaa_payouts').select('*').eq('status', 'pending').order('created_at', { ascending: true })) || []
  const pro = await profils(rows.map((r) => r.user_id))
  return rows.map((r) => ({ ...r, _personne: pro[r.user_id] || null }))
}

export const marquerVerse = async (id, reference) =>
  verifier(await supabase.rpc('lokaa_admin_verser', { p_payout: id, p_reference: reference || null }))

export async function chiffres() {
  const rows = verifier(await supabase.from('lokaa_bookings').select('status, total_amount, subtotal, commission_amount').limit(5000)) || []
  const parStatut = {}
  let commission = 0
  let volume = 0
  for (const r of rows) {
    parStatut[r.status] = (parStatut[r.status] || 0) + 1
    if (['confirmed', 'ongoing', 'completed'].includes(r.status)) {
      commission += Number(r.commission_amount || 0)
      volume += Number(r.subtotal || 0)
    }
  }
  return { total: rows.length, parStatut, commission, volume, tronque: rows.length >= 5000 }
}
