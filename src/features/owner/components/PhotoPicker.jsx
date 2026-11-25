import { useRef } from 'react';
import { Camera, X } from 'lucide-react';

// Photos déjà envoyées (existantes) + photos choisies sur le téléphone (nouvelles).
export default function PhotoPicker({
  existantes = [],
  onRetirerExistante,
  nouvelles,
  onAjouter,
  onRetirerNouvelle,
  max,
  desactive,
  erreur,
}) {
  const champ = useRef(null);
  const total = existantes.length + nouvelles.length;

  return (
    <div>
      <div className="ow-photos">
        {existantes.map((m) => (
          <div className="ow-photo" key={m.id}>
            <img src={m.media_url} alt="Photo du matériel" loading="lazy" />
            {onRetirerExistante && (
              <button
                type="button"
                className="ow-photo-retirer"
                onClick={() => onRetirerExistante(m)}
                disabled={desactive}
                aria-label="Retirer cette photo"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {nouvelles.map((p) => (
          <div className="ow-photo" key={p.id}>
            <img src={p.apercu} alt="Nouvelle photo à envoyer" />
            <button
              type="button"
              className="ow-photo-retirer"
              onClick={() => onRetirerNouvelle(p.id)}
              disabled={desactive}
              aria-label="Retirer cette photo"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        {total < max && (
          <button
            type="button"
            className="ow-photo ow-photo-ajout"
            onClick={() => champ.current && champ.current.click()}
            disabled={desactive}
          >
            <Camera size={24} aria-hidden="true" />
            <span>Ajouter</span>
          </button>
        )}
      </div>
      <input
        ref={champ}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          onAjouter(e.target.files);
          e.target.value = '';
        }}
      />
      <p className="ow-aide">
        {total} sur {max} photos. Elles sont réduites automatiquement avant l’envoi.
      </p>
      {erreur && (
        <p className="ow-erreur-champ" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}
