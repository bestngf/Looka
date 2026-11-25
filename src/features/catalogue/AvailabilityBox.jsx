import { useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { checkAvailability } from './api';
import { formatFcfa, plural } from './format';

export default function AvailabilityBox({ listing, onReserve }) {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [qte, setQte] = useState(1);
  const [etat, setEtat] = useState({ loading: false, error: '', result: null });
  const max = Math.max(1, Number(listing.quantity_total) || 1);

  const changer = (fn) => (v) => {
    fn(v);
    setEtat({ loading: false, error: '', result: null });
  };

  async function verifier() {
    if (!debut || !fin) return setEtat({ loading: false, error: 'Choisis une date de début et une date de fin.', result: null });
    if (fin <= debut) return setEtat({ loading: false, error: 'La date de fin doit être après la date de début.', result: null });
    setEtat({ loading: true, error: '', result: null });
    try {
      const result = await checkAvailability({ listingId: listing.id, debut, fin, quantite: qte });
      setEtat({ loading: false, error: '', result });
    } catch {
      setEtat({ loading: false, error: 'Impossible de vérifier la disponibilité. Réessaie dans un instant.', result: null });
    }
  }

  const r = etat.result;
  return (
    <section className="cat-box">
      <h2>Vérifier la disponibilité</h2>
      <div className="cat-dates">
        <label>
          Du
          <input type="date" min={aujourdhui} value={debut} onChange={(e) => changer(setDebut)(e.target.value)} />
        </label>
        <label>
          Au
          <input type="date" min={debut || aujourdhui} value={fin} onChange={(e) => changer(setFin)(e.target.value)} />
        </label>
      </div>
      <div className="cat-qty">
        <span>Quantité</span>
        <button type="button" onClick={() => changer(setQte)(Math.max(1, qte - 1))} aria-label="Moins" disabled={qte <= 1}>
          <Minus size={16} />
        </button>
        <strong>{qte}</strong>
        <button type="button" onClick={() => changer(setQte)(Math.min(max, qte + 1))} aria-label="Plus" disabled={qte >= max}>
          <Plus size={16} />
        </button>
      </div>
      <button type="button" className="cat-btn" onClick={verifier} disabled={etat.loading}>
        {etat.loading ? 'Vérification…' : 'Vérifier'}
      </button>

      {etat.error && <p className="cat-msg cat-msg--err" role="alert">{etat.error}</p>}
      {r && r.available && (
        <div className="cat-msg cat-msg--ok">
          <strong><Check size={16} /> Disponible sur ces dates</strong>
          <dl>
            <dt>Durée</dt><dd>{plural(r.days, 'jour', 'jours')}</dd>
            <dt>Prix par jour</dt><dd>{formatFcfa(r.price_per_day)}</dd>
            <dt>Location</dt><dd>{formatFcfa(r.rental_subtotal)}</dd>
            <dt>Caution</dt><dd>{formatFcfa(r.deposit_total)}</dd>
          </dl>
        </div>
      )}
      {r && !r.available && (
        <div className="cat-msg cat-msg--err">
          <strong><X size={16} /> Pas disponible sur ces dates</strong>
          {Number(r.quantity_available) > 0 && <span>Il reste {plural(r.quantity_available, 'unité', 'unités')}.</span>}
        </div>
      )}

      <button
        type="button"
        className="cat-btn cat-btn--solid cat-btn--big"
        disabled={r && r.available === false}
        onClick={() => onReserve({ debut, fin, qte })}
      >
        Réserver
      </button>
    </section>
  );
}
