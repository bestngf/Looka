import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import '../features/catalogue/catalogue.css';
import { fetchCategories, fetchListings } from '../features/catalogue/api';
import { useAsync } from '../features/catalogue/useAsync';
import { MSG_RESEAU } from '../features/catalogue/constants';
import { plural } from '../features/catalogue/format';
import { EmptyBox, ErrorBox, LoadingCards } from '../features/catalogue/States';
import ListingCard from '../features/catalogue/ListingCard';
import FilterPanel from '../features/catalogue/FilterPanel';

export default function CataloguePage() {
  const [params, setParams] = useSearchParams();
  const filtres = {
    q: params.get('q') || '',
    ville: params.get('ville') || '',
    max: params.get('max') || '',
    cat: params.get('cat') || '',
    liv: params.get('liv') === '1',
    tri: params.get('tri') || 'recent',
  };
  const cle = params.toString();
  const [ouvert, setOuvert] = useState(false);
  const [mot, setMot] = useState(filtres.q);
  const [liste, setListe] = useState({ items: [], total: 0, page: 0, loading: true, error: false });
  const [plus, setPlus] = useState({ loading: false, error: false });
  const cats = useAsync(fetchCategories, []);
  const reqId = useRef(0);

  const charger = useCallback(() => {
    const id = ++reqId.current;
    setListe({ items: [], total: 0, page: 0, loading: true, error: false });
    setPlus({ loading: false, error: false });
    fetchListings({ ...filtres, page: 0 })
      .then((r) => id === reqId.current && setListe({ items: r.items, total: r.total, page: 0, loading: false, error: false }))
      .catch(() => id === reqId.current && setListe((s) => ({ ...s, loading: false, error: true })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  useEffect(() => {
    charger();
    setMot(filtres.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charger]);

  function voirPlus() {
    const id = reqId.current;
    const suivante = liste.page + 1;
    setPlus({ loading: true, error: false });
    fetchListings({ ...filtres, page: suivante })
      .then((r) => {
        if (id !== reqId.current) return;
        setListe((s) => ({ ...s, items: [...s.items, ...r.items], total: r.total, page: suivante }));
        setPlus({ loading: false, error: false });
      })
      .catch(() => id === reqId.current && setPlus({ loading: false, error: true }));
  }

  function appliquer(v) {
    const p = new URLSearchParams();
    if (v.q && v.q.trim()) p.set('q', v.q.trim());
    if (v.ville && v.ville.trim()) p.set('ville', v.ville.trim());
    if (Number(v.max) > 0) p.set('max', String(v.max));
    if (v.cat) p.set('cat', v.cat);
    if (v.liv) p.set('liv', '1');
    if (v.tri && v.tri !== 'recent') p.set('tri', v.tri);
    setParams(p);
  }

  const nbFiltres = [filtres.ville, filtres.max, filtres.cat, filtres.liv, filtres.tri !== 'recent'].filter(Boolean).length;
  const reste = liste.total - liste.items.length;

  return (
    <div className="cat-page">
      <div className="cat-kente" aria-hidden="true" />
      <div className="cat-wrap">
        <h1 className="cat-title">Annonces</h1>
        <form
          className="cat-search cat-search--flat"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            appliquer({ ...filtres, q: mot });
          }}
        >
          <input
            type="search"
            value={mot}
            onChange={(e) => setMot(e.target.value)}
            placeholder="Mot-clé : tente, noir, 500 W…"
            aria-label="Rechercher par mot-clé"
          />
          <button type="submit" aria-label="Lancer la recherche">
            <Search size={20} />
          </button>
        </form>
        <button type="button" className="cat-btn cat-filter-toggle" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert}>
          <SlidersHorizontal size={16} /> Filtres{nbFiltres > 0 ? ` (${nbFiltres})` : ''}
        </button>
        {ouvert && (
          <FilterPanel
            key={cle}
            values={filtres}
            categories={cats.data || []}
            onApply={(v) => {
              appliquer({ ...v, q: filtres.q });
              setOuvert(false);
            }}
            onClear={() => {
              appliquer({ q: filtres.q });
              setOuvert(false);
            }}
          />
        )}

        {liste.loading && <LoadingCards count={3} />}
        {liste.error && <ErrorBox message={MSG_RESEAU} onRetry={charger} />}
        {!liste.loading && !liste.error && liste.items.length === 0 && (
          <EmptyBox title="Aucune annonce trouvée" text="Essaie un autre mot ou retire un filtre.">
            {cle && (
              <button type="button" className="cat-btn" onClick={() => setParams(new URLSearchParams())}>
                Tout effacer
              </button>
            )}
          </EmptyBox>
        )}
        {!liste.loading && !liste.error && liste.items.length > 0 && (
          <>
            <p className="cat-count">{plural(liste.total, 'annonce', 'annonces')}</p>
            <div className="cat-list">
              {liste.items.map((it) => (
                <ListingCard key={it.id} item={it} />
              ))}
            </div>
            {plus.error && <ErrorBox message={MSG_RESEAU} onRetry={voirPlus} />}
            {!plus.error && reste > 0 && (
              <button type="button" className="cat-btn cat-btn--big cat-more" onClick={voirPlus} disabled={plus.loading}>
                {plus.loading ? 'Chargement…' : 'Voir plus'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
