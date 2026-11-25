// Pont vers le client de connexion de l'agent 1 (src/lib/supabase.js).
// Accepte un export nommé « supabase » ou un export par défaut.
import * as lib from '../../../lib/supabase';

export const supabase = lib.supabase || lib.default;
export const BUCKET_PHOTOS = 'lokaa-photos';
