import { useEffect, useRef, useState } from 'react';
import { TYPES_PHOTO } from '../utils/image';

// Photos choisies sur le téléphone, pas encore envoyées.
export function usePhotosLocales(max) {
  const [photos, setPhotos] = useState([]);
  const [erreur, setErreur] = useState(null);
  const apercus = useRef([]);

  useEffect(
    () => () => {
      apercus.current.forEach((u) => URL.revokeObjectURL(u));
    },
    []
  );

  function ajouter(liste) {
    setErreur(null);
    const fichiers = Array.from(liste || []);
    if (fichiers.length === 0) return;
    const valides = fichiers.filter((f) => TYPES_PHOTO.includes(f.type));
    if (valides.length < fichiers.length) {
      setErreur('Seules les photos JPEG, PNG ou WebP sont acceptées.');
    }
    const place = Math.max(0, max - photos.length);
    if (valides.length > place) {
      setErreur('Tu peux ajouter ' + max + ' photos au maximum.');
    }
    const ajoutees = valides.slice(0, place).map((f) => {
      const apercu = URL.createObjectURL(f);
      apercus.current.push(apercu);
      return { id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), fichier: f, apercu };
    });
    if (ajoutees.length) setPhotos((p) => [...p, ...ajoutees]);
  }

  function retirer(id) {
    setPhotos((p) => p.filter((x) => x.id !== id));
  }

  return { photos, erreur, ajouter, retirer };
}
