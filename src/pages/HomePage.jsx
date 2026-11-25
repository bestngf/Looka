import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import '../features/catalogue/catalogue.css';
import { fetchCategories, fetchListings } from '../features/catalogue/api';
import { useAsync } from '../features/catalogue/useAsync';
import { MSG_RESEAU } from '../features/catalogue/constants';
import { EmptyBox, ErrorBox, LoadingCards } from '../features/catalogue/States';
import CategoryIcon from '../features/catalogue/CategoryIcon';
import ListingCard from '../features/catalogue/ListingCard';

export default function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const cats = useAsync(fetchCategories, []);
  const recents = useAsync(() => fetchListings({ size: 4 }), []);

  function chercher(e) {
    e.preventDefault();
    navigate(q.trim() ? `/annonces?q=${encodeURIComponent(q.trim())}` : '/annonces');
  }

  return (
    <div className="cat-page">
      <header className="cat-hero">
        <div className="cat-kente" aria-hidden="true" />
        <div className="cat-hero__in">
          <h1>Le matériel qu'il vous faut, près de chez vous</h1>
          <p>Louez à des propriétaires du Togo, pour un jour ou plusieurs.</p>
          <form className="cat-search" onSubmit={chercher} role="search">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Que cherchez-vous ?"
              aria-label="Rechercher une annonce"
            />
            <button type="submit" aria-label="Lancer la recherche">
              <Search size={20} />
            </button>
          </form>
        </div>
        <div className="cat-gold-line" aria-hidden="true" />
      </header>

      <section className="cat-section">
        <h2>Catégories</h2>
        {cats.loading && (
          <div className="cat-cats" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="cat-cat cat-skel" key={i}>
                <div className="cat-skel__line" style={{ width: '60%' }} />
              </div>
            ))}
          </div>
        )}
        {cats.error && <ErrorBox message={MSG_RESEAU} onRetry={cats.reload} />}
        {!cats.loading && !cats.error && cats.data.length === 0 && (
          <EmptyBox title="Aucune catégorie pour le moment" text="Reviens bientôt." />
        )}
        {!cats.loading && !cats.error && cats.data.length > 0 && (
          <div className="cat-cats">
            {cats.data.map((c) => (
              <Link key={c.id} to={`/annonces?cat=${encodeURIComponent(c.id)}`} className="cat-cat">
                <CategoryIcon icon={c.icon || c.slug} />
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="cat-section">
        <div className="cat-section__head">
          <h2>Dernières annonces</h2>
          <Link to="/annonces" className="cat-link">Voir tout</Link>
        </div>
        {recents.loading && <LoadingCards count={2} />}
        {recents.error && <ErrorBox message={MSG_RESEAU} onRetry={recents.reload} />}
        {!recents.loading && !recents.error && recents.data.items.length === 0 && (
          <EmptyBox title="Aucune annonce pour le moment" text="Les premières annonces arrivent bientôt." />
        )}
        {!recents.loading && !recents.error && recents.data.items.length > 0 && (
          <div className="cat-list">
            {recents.data.items.map((it) => (
              <ListingCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
