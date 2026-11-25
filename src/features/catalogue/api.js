import { supabase } from '../../lib/supabase';

export const PAGE_SIZE = 10;
const COLS =
  'id, owner_id, category_id, title, description, item_condition, city, price_per_day, quantity_total, deposit_amount, delivery_available, status';

const clean = (s) => String(s || '').replace(/[%,()*\\]/g, ' ').trim();

export function photoUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from('lokaa-photos').getPublicUrl(path).data.publicUrl;
}

async function loadPhotos(ids) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from('lokaa_listing_media')
    .select('listing_id, media_url, media_type, position')
    .in('listing_id', ids)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data || []).filter((m) => {
    const t = String(m.media_type || '').toLowerCase();
    return !t || t.startsWith('image') || t === 'photo';
  });
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('lokaa_categories')
    .select('id, name, slug, icon, position')
    .order('position', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchListings({
  q = '', ville = '', max = '', cat = '', liv = false, tri = 'recent', page = 0, size = PAGE_SIZE,
} = {}) {
  const from = page * size;
  const to = from + size - 1;
  const build = (avecDate) => {
    let query = supabase.from('lokaa_listings').select(COLS, { count: 'exact' }).eq('status', 'published');
    const mot = clean(q);
    if (mot) query = query.or(`title.ilike.*${mot}*,description.ilike.*${mot}*`);
    const v = clean(ville);
    if (v) query = query.ilike('city', `%${v}%`);
    if (Number(max) > 0) query = query.lte('price_per_day', Number(max));
    if (cat) query = query.eq('category_id', cat);
    if (liv) query = query.eq('delivery_available', true);
    if (tri === 'prix') query = query.order('price_per_day', { ascending: true });
    else if (avecDate) query = query.order('created_at', { ascending: false });
    return query.order('id', { ascending: true }).range(from, to);
  };
  let res = await build(true);
  // Si la colonne de date n'est pas lisible, on retente sans tri par date.
  if (res.error && tri !== 'prix') res = await build(false);
  if (res.error) throw res.error;
  const items = res.data || [];
  const premiere = {};
  try {
    for (const p of await loadPhotos(items.map((i) => i.id))) {
      if (!premiere[p.listing_id]) premiere[p.listing_id] = photoUrl(p.media_url);
    }
  } catch {
    /* les annonces s'affichent sans photo */
  }
  return {
    items: items.map((i) => ({ ...i, cover: premiere[i.id] || null })),
    total: res.count ?? items.length,
  };
}

async function fetchOwner(ownerId) {
  const { data, error } = await supabase.rpc('lokaa_proprietaire_public', { p_id: ownerId });
  if (error) return null;
  return Array.isArray(data) ? data[0] || null : data || null;
}

export async function fetchListingFull(id) {
  const { data: l, error } = await supabase.from('lokaa_listings').select(COLS).eq('id', id).maybeSingle();
  if (error) {
    if (error.code === '22P02') return null; // identifiant invalide
    throw error;
  }
  if (!l || l.status !== 'published') return null;
  const [photos, regles, owner, cats] = await Promise.all([
    loadPhotos([l.id]).catch(() => []),
    supabase
      .from('lokaa_pricing_rules')
      .select('minimum_days, price_per_day')
      .eq('listing_id', l.id)
      .order('minimum_days', { ascending: true })
      .then((r) => (r.error ? [] : r.data || [])),
    fetchOwner(l.owner_id),
    fetchCategories().catch(() => []),
  ]);
  return {
    listing: l,
    photos: photos.map((p) => photoUrl(p.media_url)).filter(Boolean),
    rules: regles,
    owner,
    category: cats.find((c) => String(c.id) === String(l.category_id)) || null,
  };
}

export async function checkAvailability({ listingId, debut, fin, quantite }) {
  const { data, error } = await supabase.rpc('lokaa_check_availability', {
    p_listing_id: listingId,
    p_start_at: `${debut}T00:00:00Z`,
    p_end_at: `${fin}T00:00:00Z`,
    p_quantity: quantite,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}
