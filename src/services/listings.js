// Annonces du propriétaire : lecture, création, modification, pause, photos, prix dégressifs.
// Aucune table ni aucun champ inventé : seulement ceux du document du projet.
import { supabase, BUCKET_PHOTOS } from '../features/owner/lib/client';
import { nomFichier } from '../features/owner/utils/image';

function verifier(reponse) {
  if (reponse.error) throw reponse.error;
  return reponse.data;
}

export async function sessionUtilisateurId() {
  const { data } = await supabase.auth.getSession();
  return (data && data.session && data.session.user && data.session.user.id) || null;
}

export async function utilisateurId() {
  const id = await sessionUtilisateurId();
  if (!id) throw new Error('non_connecte');
  return id;
}

export async function fetchCategories() {
  const res = await supabase
    .from('lokaa_categories')
    .select('*')
    .order('position', { ascending: true });
  return verifier(res) || [];
}

export async function fetchMesAnnonces() {
  const uid = await utilisateurId();
  const annonces =
    verifier(
      await supabase.from('lokaa_listings').select('*').eq('owner_id', uid).neq('status', 'archived')
    ) || [];
  if (annonces.length === 0) return [];

  const ids = annonces.map((a) => a.id);
  const medias =
    verifier(await supabase.from('lokaa_listing_media').select('*').in('listing_id', ids)) || [];

  return annonces
    .map((a) => ({
      ...a,
      medias: medias
        .filter((m) => m.listing_id === a.id)
        .sort((x, y) => (x.position || 0) - (y.position || 0)),
    }))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

export async function fetchAnnonce(id) {
  const uid = await utilisateurId();
  const annonce = verifier(
    await supabase.from('lokaa_listings').select('*').eq('id', id).eq('owner_id', uid).single()
  );
  const medias =
    verifier(await supabase.from('lokaa_listing_media').select('*').eq('listing_id', id)) || [];
  const regles =
    verifier(await supabase.from('lokaa_pricing_rules').select('*').eq('listing_id', id)) || [];
  return {
    annonce,
    medias: medias.sort((x, y) => (x.position || 0) - (y.position || 0)),
    regles: regles.sort((x, y) => x.minimum_days - y.minimum_days),
  };
}

// Crée (id = null) ou modifie l'annonce. Une nouvelle annonce commence toujours en brouillon.
export async function enregistrerAnnonce(id, champs) {
  const uid = await utilisateurId();
  if (id) {
    const res = await supabase
      .from('lokaa_listings')
      .update(champs)
      .eq('id', id)
      .eq('owner_id', uid)
      .select('id')
      .single();
    return verifier(res).id;
  }
  const res = await supabase
    .from('lokaa_listings')
    .insert({ ...champs, owner_id: uid, status: 'draft' })
    .select('id')
    .single();
  return verifier(res).id;
}

export async function remplacerPrixDegressifs(listingId, regles) {
  verifier(await supabase.from('lokaa_pricing_rules').delete().eq('listing_id', listingId));
  if (!regles || regles.length === 0) return;
  const lignes = regles.map((r) => ({
    listing_id: listingId,
    minimum_days: r.minimum_days,
    price_per_day: r.price_per_day,
  }));
  verifier(await supabase.from('lokaa_pricing_rules').insert(lignes));
}

// « Publier » = envoyer à l'équipe pour validation.
export async function envoyerEnValidation(id) {
  const uid = await utilisateurId();
  const res = await supabase
    .from('lokaa_listings')
    .update({ status: 'pending_review' })
    .eq('id', id)
    .eq('owner_id', uid)
    .select('status')
    .single();
  return verifier(res).status;
}

// Pause : changement direct de statut (published <-> paused), si les droits de la base l'autorisent.
export async function changerPause(id, mettreEnPause) {
  const uid = await utilisateurId();
  const res = await supabase
    .from('lokaa_listings')
    .update({ status: mettreEnPause ? 'paused' : 'published' })
    .eq('id', id)
    .eq('owner_id', uid)
    .select('status')
    .single();
  return verifier(res).status;
}

// Envoie une photo déjà réduite (blob) puis l'ajoute à l'annonce.
export async function televerserPhoto(listingId, blob, position) {
  const uid = await utilisateurId();
  const chemin = uid + '/' + listingId + '/' + nomFichier();
  const envoi = await supabase.storage
    .from(BUCKET_PHOTOS)
    .upload(chemin, blob, { contentType: 'image/jpeg', upsert: false });
  if (envoi.error) throw envoi.error;

  const url = supabase.storage.from(BUCKET_PHOTOS).getPublicUrl(chemin).data.publicUrl;
  const res = await supabase
    .from('lokaa_listing_media')
    .insert({ listing_id: listingId, media_url: url, media_type: 'image', position })
    .select('*')
    .single();
  if (res.error) {
    await supabase.storage.from(BUCKET_PHOTOS).remove([chemin]);
    throw res.error;
  }
  return res.data;
}

export async function supprimerPhoto(media) {
  verifier(await supabase.from('lokaa_listing_media').delete().eq('id', media.id));
  // Nettoyage du fichier : sans gravité si ça échoue.
  const repere = '/' + BUCKET_PHOTOS + '/';
  const index = String(media.media_url || '').indexOf(repere);
  if (index >= 0) {
    const chemin = media.media_url.slice(index + repere.length);
    await supabase.storage.from(BUCKET_PHOTOS).remove([chemin]);
  }
}
