// Messages d'erreur en français simple (jamais de texte technique à l'écran).

export function messageErreur(err, defaut) {
  const texte = String((err && err.message) || err || '').toLowerCase();

  if (texte.includes('type_image')) return 'Choisis une photo JPEG, PNG ou WebP.';
  if (texte.includes('image_illisible')) return 'Cette photo ne peut pas être lue. Essaie-en une autre.';
  if (texte.includes('image_trop_lourde')) return 'Cette photo est trop lourde. Essaie-en une autre.';
  if (texte.includes('non_connecte')) return 'Tu n’es pas connecté. Connecte-toi puis réessaie.';
  if (
    texte.includes('failed to fetch') ||
    texte.includes('network') ||
    texte.includes('load failed')
  ) {
    return 'Pas de connexion. Vérifie ton réseau puis réessaie.';
  }
  if (
    texte.includes('row-level security') ||
    texte.includes('permission') ||
    texte.includes('not allowed') ||
    texte.includes('jwt') ||
    texte.includes('not authorized')
  ) {
    return 'Tu n’as pas le droit de faire cette action. Reconnecte-toi ou contacte l’équipe LOKAA.';
  }
  return defaut || 'Un problème est survenu. Réessaie dans un instant.';
}
