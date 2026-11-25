// Réduit une photo sur le téléphone avant l'envoi (jpeg/png/webp, 5 Mo max).

export const TYPES_PHOTO = ['image/jpeg', 'image/png', 'image/webp'];
export const TAILLE_MAX_OCTETS = 5 * 1024 * 1024;

function chargerImage(fichier) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image_illisible'));
    };
    img.src = url;
  });
}

function versBlob(canvas, qualite) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('image_illisible'))),
      'image/jpeg',
      qualite
    );
  });
}

export async function reduireImage(fichier, maxCote = 1280) {
  if (!TYPES_PHOTO.includes(fichier.type)) throw new Error('type_image');
  const img = await chargerImage(fichier);
  const ratio = Math.min(1, maxCote / Math.max(img.width, img.height));
  const largeur = Math.max(1, Math.round(img.width * ratio));
  const hauteur = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, largeur, hauteur);
  ctx.drawImage(img, 0, 0, largeur, hauteur);

  let qualite = 0.82;
  let blob = await versBlob(canvas, qualite);
  while (blob.size > TAILLE_MAX_OCTETS && qualite > 0.4) {
    qualite -= 0.1;
    blob = await versBlob(canvas, qualite);
  }
  if (blob.size > TAILLE_MAX_OCTETS) throw new Error('image_trop_lourde');
  return blob;
}

export function nomFichier() {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
}
