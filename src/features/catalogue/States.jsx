import { AlertCircle, SearchX } from 'lucide-react';

export function LoadingCards({ count = 3 }) {
  return (
    <div className="cat-list" aria-busy="true" aria-label="Chargement des annonces">
      {Array.from({ length: count }).map((_, i) => (
        <div className="cat-card cat-skel" key={i}>
          <div className="cat-skel__img" />
          <div className="cat-card__body">
            <div className="cat-skel__line" style={{ width: '70%' }} />
            <div className="cat-skel__line" style={{ width: '40%' }} />
            <div className="cat-skel__line" style={{ width: '55%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="cat-state" role="alert">
      <AlertCircle size={30} />
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="cat-btn cat-btn--solid" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}

export function EmptyBox({ title, text, children }) {
  return (
    <div className="cat-state">
      <SearchX size={30} />
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
