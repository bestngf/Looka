import { AlertTriangle, RotateCw } from 'lucide-react';

export function Chargement({ lignes = 3 }) {
  return (
    <div className="ow-pile" aria-busy="true" aria-live="polite">
      {Array.from({ length: lignes }).map((_, i) => (
        <div className="ow-carte" key={i}>
          <div className="ow-sq ow-sq-titre" />
          <div className="ow-sq ow-sq-ligne" />
          <div className="ow-sq ow-sq-ligne ow-sq-court" />
        </div>
      ))}
      <span className="ow-sr">Chargement en cours…</span>
    </div>
  );
}

export function ErreurEtat({ message, onRetry }) {
  return (
    <div className="ow-etat ow-etat-erreur" role="alert">
      <AlertTriangle size={28} aria-hidden="true" />
      <p className="ow-etat-titre">Oups, ça n’a pas marché</p>
      <p className="ow-etat-texte">{message}</p>
      {onRetry && (
        <button type="button" className="ow-btn ow-btn-contour" onClick={onRetry}>
          <RotateCw size={18} aria-hidden="true" /> Réessayer
        </button>
      )}
    </div>
  );
}

export function VideEtat({ icone: Icone, titre, texte, children }) {
  return (
    <div className="ow-etat">
      {Icone && <Icone size={30} aria-hidden="true" />}
      <p className="ow-etat-titre">{titre}</p>
      {texte && <p className="ow-etat-texte">{texte}</p>}
      {children}
    </div>
  );
}

export function Pastille({ ton = 'neutre', children }) {
  return <span className={'ow-pastille ow-pastille-' + ton}>{children}</span>;
}
