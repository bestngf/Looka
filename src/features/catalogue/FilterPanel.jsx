import { useState } from 'react';

export default function FilterPanel({ values, categories, onApply, onClear }) {
  const [d, setD] = useState(values);
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="cat-filters"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(d);
      }}
    >
      <label>
        Ville
        <input type="text" value={d.ville} onChange={(e) => set('ville', e.target.value)} placeholder="Ex. Lomé" />
      </label>
      <label>
        Prix maximum par jour (FCFA)
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={d.max}
          onChange={(e) => set('max', e.target.value)}
          placeholder="Ex. 25000"
        />
      </label>
      <label>
        Catégorie
        <select value={d.cat} onChange={(e) => set('cat', e.target.value)}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Trier par
        <select value={d.tri} onChange={(e) => set('tri', e.target.value)}>
          <option value="recent">Les plus récentes</option>
          <option value="prix">Prix du plus bas au plus haut</option>
        </select>
      </label>
      <label className="cat-check">
        <input type="checkbox" checked={d.liv} onChange={(e) => set('liv', e.target.checked)} />
        Livraison possible
      </label>
      <div className="cat-filters__actions">
        <button type="submit" className="cat-btn cat-btn--solid">
          Appliquer
        </button>
        <button type="button" className="cat-btn" onClick={onClear}>
          Effacer
        </button>
      </div>
    </form>
  );
}
