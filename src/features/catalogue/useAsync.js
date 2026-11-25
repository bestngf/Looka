import { useEffect, useState } from 'react';

// Charge des données et gère chargement / erreur / « Réessayer ».
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let vivant = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => vivant && setState({ data, loading: false, error: null }))
      .catch((error) => vivant && setState({ data: null, loading: false, error }));
    return () => {
      vivant = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}
