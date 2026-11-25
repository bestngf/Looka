// Réservations, contrôles d'état, versements et profil du propriétaire.
// Tout changement de statut passe UNIQUEMENT par les fonctions de la base (supabase.rpc).
import { supabase, BUCKET_PHOTOS } from './lib/client';
import { nomFichier } from './utils/image';
import { utilisateurId } from '../../services/listings';

function verifier(reponse) {
  if (reponse.error) throw reponse.error;
  return reponse.data;
}

// Une fonction de la base peut aussi répondre {error: ...} sans faire échouer l'appel.
function verifierFonction(reponse) {
  const data = verifier(reponse);
  if (data && typeof data === 'object' && data.error) throw new Error(String(data.error));
  return data;
}

export async function fetchMonProfil() {
  const uid = await utilisateurId();
  const res = await supabase.from('lokaa_profiles').select('*').eq('id', uid).maybeSingle();
  return verifier(res);
}

export async function devenirProprietaire(profil) {
  const res = await supabase.rpc('lokaa_mon_profil', {
    p_nom: profil.full_name,
    p_tel: profil.phone,
    p_ville: profil.city,
    p_type: 'owner',
  });
  return verifierFonction(res);
}

// Réservations reçues par le propriétaire, avec le titre du matériel et le client (si lisibles).
export async function fetchReservations() {
  const uid = await utilisateurId();
  const reservations =
    verifier(await supabase.from('lokaa_bookings').select('*').eq('owner_id', uid)) || [];
  if (reservations.length === 0) return [];

  const ids = reservations.map((r) => r.id);
  const clientsIds = [...new Set(reservations.map((r) => r.customer_id).filter(Boolean))];

  const [items, annonces, clients] = await Promise.all([
    supabase.from('lokaa_booking_items').select('*').in('booking_id', ids),
    supabase.from('lokaa_listings').select('id, title').eq('owner_id', uid),
    clientsIds.length
      ? supabase.from('lokaa_profiles').select('*').in('id', clientsIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Ces trois lectures sont un confort : si elles échouent, on affiche quand même la réservation.
  const titres = new Map((annonces.data || []).map((a) => [a.id, a.title]));
  const parClient = new Map((clients.data || []).map((c) => [c.id, c]));

  return reservations
    .map((r) => {
      const lignes = (items.data || []).filter((i) => i.booking_id === r.id);
      const noms = [...new Set(lignes.map((i) => titres.get(i.listing_id)).filter(Boolean))];
      const client = parClient.get(r.customer_id);
      return {
        ...r,
        titre: noms.length ? noms.join(', ') : null,
        clientNom: client ? client.full_name : null,
        clientTelephone: client ? client.phone : null,
      };
    })
    .sort((a, b) => String(a.start_at || '').localeCompare(String(b.start_at || '')));
}

// Photos d'un contrôle d'état : réduites avant l'appel, envoyées dans le stockage public.
export async function televerserPhotosControle(bookingId, blobs) {
  const uid = await utilisateurId();
  const urls = [];
  for (const blob of blobs) {
    const chemin = uid + '/controles-' + bookingId + '/' + nomFichier();
    const envoi = await supabase.storage
      .from(BUCKET_PHOTOS)
      .upload(chemin, blob, { contentType: 'image/jpeg', upsert: false });
    if (envoi.error) throw envoi.error;
    urls.push(supabase.storage.from(BUCKET_PHOTOS).getPublicUrl(chemin).data.publicUrl);
  }
  return urls;
}

// stage : 'before_handover' (remise) ou 'after_return' (retour)
export async function enregistrerControle({ bookingId, stage, note, photoUrls }) {
  const res = await supabase.from('lokaa_inspections').insert({
    booking_id: bookingId,
    inspection_stage: stage,
    condition_notes: note,
    photo_urls: photoUrls,
  });
  verifier(res);
}

export async function remettre(bookingId) {
  return verifierFonction(await supabase.rpc('lokaa_remettre', { p_booking: bookingId }));
}

export async function cloturer(bookingId, retenue) {
  return verifierFonction(
    await supabase.rpc('lokaa_cloturer', { p_booking: bookingId, p_retenue: retenue })
  );
}

export async function fetchVersements() {
  const uid = await utilisateurId();
  const res = await supabase
    .from('lokaa_payouts')
    .select('*')
    .eq('user_id', uid)
    .eq('kind', 'owner');
  return (verifier(res) || []).sort((a, b) =>
    String(b.created_at || '').localeCompare(String(a.created_at || ''))
  );
}
