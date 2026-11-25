// Espace transporteur : lectures autorisées par la base + 3 fonctions officielles.
import { supabase } from '../lib/supabase'

const verifier = ({ data, error }) => { if (error) throw error; return data }

export async function livraisonsAPrendre() {
  return verifier(await supabase.from('lokaa_deliveries').select('*').eq('status', 'requested').order('created_at', { ascending: false })) || []
}

export async function mesLivraisons(uid) {
  return verifier(await supabase.from('lokaa_deliveries').select('*').eq('transporter_id', uid).order('created_at', { ascending: false })) || []
}

export async function mesGains(uid) {
  return verifier(await supabase.from('lokaa_payouts').select('*').eq('user_id', uid).eq('kind', 'transporter').order('created_at', { ascending: false })) || []
}

export async function prendreLivraison(id) {
  return verifier(await supabase.rpc('lokaa_livraison_prendre', { p_id: id }))
}

export async function changerStatut(id, statut) {
  return verifier(await supabase.rpc('lokaa_livraison_statut', { p_id: id, p_status: statut }))
}

export async function contactsLivraison(id) {
  return verifier(await supabase.rpc('lokaa_contact_livraison', { p_delivery: id }))
}

export async function devenirTransporteur(profil) {
  return verifier(await supabase.rpc('lokaa_mon_profil', {
    p_nom: profil?.full_name || '', p_tel: profil?.phone || '', p_ville: profil?.city || '', p_type: 'transporter',
  }))
}
