import { Plus, Trash2 } from 'lucide-react';

// Prix dégressifs : à partir de N jours, le prix par jour baisse.
export default function PrixDegressifs({ regles, onChange, desactive, erreur }) {
  function modifier(index, champ, valeur) {
    onChange(regles.map((r, i) => (i === index ? { ...r, [champ]: valeur } : r)));
  }
  return (
    <div>
      {regles.length === 0 && (
        <p className="ow-aide">Aucun prix dégressif. Tu peux en ajouter jusqu’à 4.</p>
      )}
      {regles.map((r, i) => (
        <div className="ow-regle" key={i}>
          <label className="ow-regle-champ">
            <span>À partir de (jours)</span>
            <input
              className="ow-input"
              inputMode="numeric"
              value={r.minimum_days}
              disabled={desactive}
              onChange={(e) => modifier(i, 'minimum_days', e.target.value.replace(/\D/g, ''))}
            />
          </label>
          <label className="ow-regle-champ">
            <span>Prix par jour (FCFA)</span>
            <input
              className="ow-input"
              inputMode="numeric"
              value={r.price_per_day}
              disabled={desactive}
              onChange={(e) => modifier(i, 'price_per_day', e.target.value.replace(/\D/g, ''))}
            />
          </label>
          <button
            type="button"
            className="ow-btn-icone"
            disabled={desactive}
            onClick={() => onChange(regles.filter((_, j) => j !== i))}
            aria-label="Supprimer ce prix dégressif"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      ))}
      {regles.length < 4 && (
        <button
          type="button"
          className="ow-btn ow-btn-contour"
          disabled={desactive}
          onClick={() => onChange([...regles, { minimum_days: '', price_per_day: '' }])}
        >
          <Plus size={18} aria-hidden="true" /> Ajouter un prix dégressif
        </button>
      )}
      {erreur && (
        <p className="ow-erreur-champ" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}
