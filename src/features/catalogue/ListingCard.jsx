import { Link } from 'react-router-dom';
import { MapPin, Package, Truck } from 'lucide-react';
import { CONDITIONS, formatFcfa } from './format';

export default function ListingCard({ item }) {
  return (
    <Link to={`/annonces/${item.id}`} className="cat-card">
      <div className="cat-card__img">
        {item.cover ? <img src={item.cover} alt={item.title} loading="lazy" /> : <Package size={34} />}
      </div>
      <div className="cat-card__body">
        <h3>{item.title}</h3>
        {item.city && (
          <span className="cat-meta">
            <MapPin size={14} /> {item.city}
          </span>
        )}
        <div className="cat-card__foot">
          <span className="cat-price">
            {formatFcfa(item.price_per_day)} <small>/ jour</small>
          </span>
          <span className="cat-tags">
            {item.delivery_available && (
              <span className="cat-tag">
                <Truck size={12} /> Livraison
              </span>
            )}
            {CONDITIONS[item.item_condition] && <span className="cat-tag">{CONDITIONS[item.item_condition]}</span>}
          </span>
        </div>
      </div>
    </Link>
  );
}
