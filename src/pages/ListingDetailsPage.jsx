import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, ShieldCheck, Star, Truck } from 'lucide-react';
import '../features/catalogue/catalogue.css';
import { supabase } from '../lib/supabase';
import { fetchListingFull } from '../features/catalogue/api';
import { useAsync } from '../features/catalogue/useAsync';
import { LOGIN_PATH, MSG_RESEAU } from '../features/catalogue/constants';
import { CONDITIONS, formatFcfa, formatNote, plural } from '../features/catalogue/format';
import { EmptyBox, ErrorBox } from '../features/catalogue/States';
import PhotoCarousel from '../features/catalogue/PhotoCarousel';
import AvailabilityBox from '../features/catalogue/AvailabilityBox';

export default function ListingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => fetchListingFull(id), [id]);
  const [connecte, setConnecte] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: d }) => setConnecte(Boolean(d?.session)));
  }, []);

  async function reserver({ debut, fin, qte }) {
    const qs = new URLSearchParams();
    if (debut && fin) {
      qs.set('debut', debut);
      qs.set('fin', fin);
      qs.set('qte', String(qte));
    }
    const cible = `/reserver/${id}${qs.toString() ? `?${qs}` : ''}`;
    const { data: d } = await supabase.auth.getSession();
    if (d?.session) navigate(cible);
    else navigate(LOGIN_PATH, { state: { from: cible } });
  }

  const retour = (
    <Link to="/annonces" className="cat-back">
      <ArrowLeft size={18} /> Annonces
    </Link>
  );

  if (loading) {
    return (
      <div className="cat-page" aria-busy="true">
        <div className="cat-wrap">
          {retour}
          <div className="cat-skel cat-carousel" />
          <div className="cat-skel__line" style={{ width: '65%', height: 22, marginTop: 16 }} />
          <div className="cat-skel__line" style={{ width: '40%', marginTop: 10 }} />
          <div className="cat-skel__line" style={{ width: '90%', marginTop: 24 }} />
          <div className="cat-skel__line" style={{ width: '80%', marginTop: 10 }} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="cat-page">
        <div className="cat-wrap">
          {retour}
          <ErrorBox message={MSG_RESEAU} onRetry={reload} />
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="cat-page">
        <div className="cat-wrap">
          {retour}
          <EmptyBox title="Annonce introuvable" text="Elle n'existe plus ou n'est pas disponible.">
            <Link to="/annonces" className="cat-btn cat-btn--solid">Voir les annonces</Link>
          </EmptyBox>
        </div>
      </div>
    );
  }

  const { listing: l, photos, rules, owner, category } = data;
  const avis = Number(owner?.nb_avis) || 0;

  return (
    <div className="cat-page">
      <div className="cat-wrap">
        {retour}
        <PhotoCarousel photos={photos} title={l.title} />

        <div className="cat-head">
          <h1>{l.title}</h1>
          <p className="cat-price cat-price--big">
            {formatFcfa(l.price_per_day)} <small>/ jour</small>
          </p>
          <div className="cat-tags">
            {category && <span className="cat-tag">{category.name}</span>}
            {CONDITIONS[l.item_condition] && <span className="cat-tag">{CONDITIONS[l.item_condition]}</span>}
            {l.city && (
              <span className="cat-tag"><MapPin size={12} /> {l.city}</span>
            )}
          </div>
        </div>

        <section className="cat-facts">
          <div>
            <ShieldCheck size={20} />
            <span>Caution</span>
            <strong>{formatFcfa(l.deposit_amount)}</strong>
          </div>
          <div>
            <Truck size={20} />
            <span>Livraison</span>
            <strong>{l.delivery_available ? 'Possible' : 'Non proposée'}</strong>
          </div>
        </section>

        {rules.length > 0 && (
          <section className="cat-box">
            <h2>Prix dégressifs</h2>
            <table className="cat-table">
              <tbody>
                <tr>
                  <td>Tarif normal</td>
                  <td>{formatFcfa(l.price_per_day)} / jour</td>
                </tr>
                {rules.map((r) => (
                  <tr key={r.minimum_days}>
                    <td>À partir de {plural(r.minimum_days, 'jour', 'jours')}</td>
                    <td>{formatFcfa(r.price_per_day)} / jour</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {l.description && (
          <section className="cat-box">
            <h2>Description</h2>
            <p className="cat-desc">{l.description}</p>
          </section>
        )}

        {owner && (
          <section className="cat-box cat-owner">
            <h2>Propriétaire</h2>
            <strong>{owner.nom}</strong>
            {owner.ville && <span className="cat-meta"><MapPin size={14} /> {owner.ville}</span>}
            {avis > 0 ? (
              <span className="cat-rating">
                <Star size={16} fill="currentColor" /> {formatNote(owner.moyenne)} ({plural(avis, 'avis', 'avis')})
              </span>
            ) : (
              <span className="cat-meta">Pas encore d'avis</span>
            )}
          </section>
        )}

        <AvailabilityBox listing={l} onReserve={reserver} />
        {!connecte && <p className="cat-note">Tu devras te connecter pour réserver.</p>}
      </div>
    </div>
  );
}
