import { useCallback, useEffect, useRef, useState } from 'react';
import { messageErreur } from '../utils/errors';

// Charge des données et gère les 3 états : chargement, erreur (avec « Réessayer »), données.
export function useChargement(fonction, deps = []) {
  const [etat, setEtat] = useState({ chargement: true, erreur: null, donnees: null });
  const [essai, setEssai] = useState(0);
  const fonctionRef = useRef(fonction);
  fonctionRef.current = fonction;

  useEffect(() => {
    let annule = false;
    setEtat((e) => ({ ...e, chargement: true, erreur: null }));
    Promise.resolve()
      .then(() => fonctionRef.current())
      .then((donnees) => {
        if (!annule) setEtat({ chargement: false, erreur: null, donnees });
      })
      .catch((err) => {
        if (!annule) setEtat({ chargement: false, erreur: messageErreur(err), donnees: null });
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, essai]);

  const reessayer = useCallback(() => setEssai((n) => n + 1), []);
  return { ...etat, reessayer };
}
