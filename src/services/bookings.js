// Accès à la base pour la réservation et l'espace client (agent 3).
// Les changements de statut passent UNIQUEMENT par les fonctions supabase.rpc de la liste officielle.
import { supabase } from '../lib/supabase'

const un = (d) => (Array.isArray(d) ? d[0] ?? null : d ?? null)

export function erreurFr(err, defaut = "Quelque chose s'est mal passé. Réessaie dans un instant.") {
  const m = String(err?.message || err || '').toLowerCase()
  if (/failed to fetch|network|load failed/.test(m)) return 'Pas de connexion. Vérifie ton réseau puis réessaie.'
  if (/jwt|not authenticated|permission|row-level|policy|denied|not_allowed|forbidden/.test(m))
    return "Tu n'as pas l'autorisation de faire cela. Reconnecte-toi puis réessaie."
  if (/disponib|available|unavailable|overlap|conflict/.test(m)) return 'Ces dates ne sont plus disponibles pour cette quantité.'
  return defaut
}

function photoUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return supabase.storage.from('lokaa-photos').getPublicUrl(path).data.publicUrl
}

async function premieresPhotos(listingIds) {
  const ids = [...new Set(listingIds.filter(Boolean))]
  if (!ids.length) return {}
  const { data, error } = await supabase
    .from('lokaa_listing_media')
    .select('listing_id, media_url, media_type, position')
    .in('listing_id', ids)
    .order('position', { ascending: true })
  if (error) return {}
  const out = {}
  for (const m of data || []) {
    const t = String(m.media_type || '').toLowerCase()
    if (t && !t.startsWith('image') && t !== 'photo') continue
    if (!out[m.listing_id]) out[m.listing_id] = photoUrl(m.media_url)
  }
  return out
}

/* ---------- Page « Réserver » ---------- */

export async function fetchListingForBooking(id) {
  const { data: l, error } = await supabase
    .from('lokaa_listings')
    .select('id, owner_id, title, city, address_details, price_per_day, quantity_total, deposit_amount, delivery_available, status')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    if (error.code === '22P02') return null // identifiant invalide
    throw error
  }
  if (!l || l.status !== 'published') return null
  const photos = await premieresPhotos([l.id])
  return { ...l, cover: photos[l.id] || null }
}

export async function checkAvailability({ listingId, debut, fin, quantite }) {
  const { data, error } = await supabase.rpc('lokaa_check_availability', {
    p_listing_id: listingId,
    p_start_at: `${debut}T00:00:00Z`,
    p_end_at: `${fin}T00:00:00Z`,
    p_quantity: quantite,
  })
  if (error) throw error
  return un(data)
}

// Délai de 15 minutes et montants : décidés par la base.
export async function createBooking({ listingId, quantite, debut, fin, fraisLivraison = 0 }) {
  const { data, error } = await supabase.rpc('lokaa_create_booking', {
    p_listing_id: listingId,
    p_quantity: quantite,
    p_start_at: `${debut}T00:00:00Z`,
    p_end_at: `${fin}T00:00:00Z`,
    p_delivery_fee: fraisLivraison,
  })
  if (error) throw error
  const r = un(data)
  const id = r?.booking_id ?? r?.id
  if (!id) throw new Error('reponse_inattendue')
  return { id, brut: r }
}

export async function demanderLivraison({ bookingId, pickup, dest }) {
  const { data, error } = await supabase.rpc('lokaa_demander_livraison', {
    p_booking: bookingId,
    p_type: 'delivery',
    p_pickup: pickup,
    p_dest: dest,
  })
  if (error) throw error
  return data
}

/* ---------- Espace client ---------- */

// Ajoute à chaque réservation : _title, _cover, _qty (lus dans lokaa_booking_items et lokaa_listings).
async function decorer(rows) {
  if (!rows.length) return rows
  let items = []
  try {
    const r = await supabase.from('lokaa_booking_items').select('*').in('booking_id', rows.map((b) => b.id))
    if (!r.error) items = r.data || []
  } catch {
    /* les réservations s'affichent sans détail d'article */
  }
  const listingIds = items.map((i) => i.listing_id).filter(Boolean)
  let titres = {}
  if (listingIds.length) {
    const r = await supabase.from('lokaa_listings').select('id, title').in('id', [...new Set(listingIds)])
    if (!r.error) titres = Object.fromEntries((r.data || []).map((l) => [l.id, l.title]))
  }
  const photos = await premieresPhotos(listingIds)
  return rows.map((b) => {
    const mes = items.filter((i) => i.booking_id === b.id)
    const premier = mes[0]
    return {
      ...b,
      _title: (premier && titres[premier.listing_id]) || 'Location de matériel',
      _cover: (premier && photos[premier.listing_id]) || null,
      _qty: mes.reduce((s, i) => s + (Number(i.quantity ?? i.qty) || 0), 0) || null,
    }
  })
}

export async function fetchMyBookings(userId) {
  const { data, error } = await supabase
    .from('lokaa_bookings')
    .select('*')
    .eq('customer_id', userId)
    .order('start_at', { ascending: false })
  if (error) throw error
  return decorer(data || [])
}

export async function fetchBookingFull(id) {
  const { data, error } = await supabase.from('lokaa_bookings').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return (await decorer([data]))[0]
}

export async function annulerReservation({ bookingId, motif }) {
  const { data, error } = await supabase.rpc('lokaa_annuler', { p_booking: bookingId, p_motif: motif || null })
  if (error) throw error
  return data
}

export async function fetchOwnerPublic(ownerId) {
  const { data, error } = await supabase.rpc('lokaa_proprietaire_public', { p_id: ownerId })
  if (error) return null
  return un(data)
}

export async function fetchOwnerPhone(ownerId) {
  const { data, error } = await supabase.from('lokaa_profiles').select('phone').eq('id', ownerId).maybeSingle()
  if (error) return null
  return data?.phone || null
}

export async function fetchDeliveries(bookingId) {
  const { data, error } = await supabase.from('lokaa_deliveries').select('id, delivery_type, status').eq('booking_id', bookingId)
  if (error) return []
  return data || []
}

export async function fetchMyReview(bookingId, userId) {
  const { data, error } = await supabase
    .from('lokaa_reviews')
    .select('rating, comment')
    .eq('booking_id', bookingId)
    .eq('reviewer_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function submitReview({ bookingId, reviewerId, revieweeId, rating, comment }) {
  const { error } = await supabase.from('lokaa_reviews').insert({
    booking_id: bookingId,
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    rating,
    comment: comment || null,
  })
  if (error) throw error
}
