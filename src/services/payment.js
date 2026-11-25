// Paiement mobile : PAS ENCORE DISPONIBLE côté serveur (fonction « lokaa-pay » en préparation).
// Ce fichier est le SEUL endroit qui parlera au paiement. Pour l'instant, il renvoie une erreur « non activé ».
// Important : on ne confirme jamais un paiement ici. Le statut « confirmed » vient de la base.
export const PAIEMENT_ACTIF = false

export async function payerReservation(/* { bookingId, telephone, operateur } */) {
  throw new Error("Le paiement mobile n'est pas encore activé.")
}
