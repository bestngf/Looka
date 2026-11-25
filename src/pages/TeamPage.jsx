import { useState } from 'react'
import { Check, X, MessageCircle, Phone } from 'lucide-react'
import { Button, EmptyState, ErrorState, Loading, Input } from '../components/ui/ui'
import { useLoad, fcfa, dateHeure, messageErreur, photoUrl, lienWhatsApp, lienAppel } from '../features/transport/utils'
import {
  suisAdmin, annoncesAValider, decisionAnnonce, litiges, trancherLitige, versementsAFaire, marquerVerse, chiffres,
} from '../services/admin'
import '../features/admin/admin.css'

const ETAT = { new: 'Neuf', like_new: 'Comme neuf', good: 'Bon état', fair: 'État correct' }
const TYPE_VERS = { owner: 'Propriétaire', transporter: 'Transporteur', refund: 'Remboursement client' }
const STATUTS = { pending: 'En attente', confirmed: 'Payées', ongoing: 'En cours', completed: 'Terminées', cancelled: 'Annulées', disputed: 'Litiges' }

function Contact({ p }) {
  if (!p) return <span className="ad-muted">Profil introuvable</span>
  return (
    <div className="ad-actions">
      <strong>{p.full_name || 'Sans nom'}</strong>
      {p.phone && <a href={lienAppel(p.phone)}><Phone size={14} aria-hidden="true" /> {p.phone}</a>}
      {p.phone && <a href={lienWhatsApp(p.phone)} target="_blank" rel="noreferrer"><MessageCircle size={14} aria-hidden="true" /> WhatsApp</a>}
    </div>
  )
}

function Chargeur({ charger, vide, rendu, cle }) {
  const { data, loading, error, reload } = useLoad(charger, [cle])
  if (loading) return <Loading lines={2} />
  if (error) return <ErrorState message={messageErreur(error)} onRetry={reload} />
  if (!data.length) return vide
  return <div className="ad-list">{data.map((x) => rendu(x, reload))}</div>
}

function AnnonceCarte({ a, onChange }) {
  const [refus, setRefus] = useState(false)
  const [note, setNote] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  async function decider(d) {
    if (d === 'refuser' && note.trim().length < 3) { setErreur('Explique brièvement pourquoi (le propriétaire le verra).'); return }
    setEnvoi(true); setErreur('')
    try { await decisionAnnonce(a.id, d, note); onChange() } catch (e) { setErreur(messageErreur(e)); setEnvoi(false) }
  }
  return (
    <article className="ad-card">
      {a._photos.length > 0
        ? <div className="ad-photos">{a._photos.map((p, i) => <img key={i} src={photoUrl(p)} alt={`Photo ${i + 1} de ${a.title}`} loading="lazy" />)}</div>
        : <div className="ad-muted">⚠ Aucune photo : mieux vaut refuser.</div>}
      <div className="ad-head"><div className="ad-title">{a.title}</div><div className="ad-prix">{fcfa(a.price_per_day)}/jour</div></div>
      <div className="ad-muted">{a.city} · {ETAT[a.item_condition] || a.item_condition} · {a.quantity_total} en stock · caution {fcfa(a.deposit_amount)}</div>
      {a.description && <div>{a.description}</div>}
      <Contact p={a._proprio} />
      {erreur && <div className="ad-err" role="alert">{erreur}</div>}
      {refus ? (
        <>
          <textarea className="ad-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Motif du refus" maxLength={500} />
          <div className="ad-actions">
            <Button variant="surface" disabled={envoi} onClick={() => setRefus(false)}>Annuler</Button>
            <Button variant="green" disabled={envoi} onClick={() => decider('refuser')}>Confirmer le refus</Button>
          </div>
        </>
      ) : (
        <div className="ad-actions">
          <Button variant="surface" disabled={envoi} onClick={() => setRefus(true)}><X size={16} aria-hidden="true" /> Refuser</Button>
          <Button variant="green" disabled={envoi} onClick={() => decider('publier')}><Check size={16} aria-hidden="true" /> Publier</Button>
        </div>
      )}
    </article>
  )
}

function LitigeCarte({ b, onChange }) {
  const [retenue, setRetenue] = useState(String(b.deposit_retained ?? 0))
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  async function trancher() {
    const v = Number(retenue)
    if (Number.isNaN(v) || v < 0 || v > Number(b.deposit_total)) { setErreur(`La retenue doit être entre 0 et ${fcfa(b.deposit_total)}.`); return }
    if (!window.confirm(`Retenir ${fcfa(v)} sur la caution et rendre ${fcfa(Number(b.deposit_total) - v)} au client ?`)) return
    setEnvoi(true); setErreur('')
    try { await trancherLitige(b.id, v); onChange() } catch (e) { setErreur(messageErreur(e)); setEnvoi(false) }
  }
  return (
    <article className="ad-card">
      <div className="ad-head"><div className="ad-title">Réservation {b.booking_number}</div><span className="ad-pill">Litige</span></div>
      <div className="ad-muted">Caution {fcfa(b.deposit_total)} · retenue demandée par le propriétaire : {fcfa(b.deposit_retained)}</div>
      <div className="ad-box"><strong>Propriétaire</strong><Contact p={b._proprio} /></div>
      <div className="ad-box"><strong>Client</strong><Contact p={b._client} /></div>
      {b._controles.length === 0 && <div className="ad-muted">Aucun contrôle d'état enregistré.</div>}
      {b._controles.map((c, i) => (
        <div className="ad-box" key={i}>
          <strong>{c.inspection_stage === 'before_handover' ? 'À la remise' : 'Au retour'} · {dateHeure(c.created_at)}</strong>
          {c.condition_notes && <div>{c.condition_notes}</div>}
          {Array.isArray(c.photo_urls) && c.photo_urls.length > 0 && <div className="ad-photos">{c.photo_urls.map((p, j) => <img key={j} src={photoUrl(p)} alt={`Contrôle photo ${j + 1}`} loading="lazy" />)}</div>}
        </div>
      ))}
      <label className="ad-muted" htmlFor={`r-${b.id}`}>Montant retenu sur la caution (FCFA)</label>
      <Input id={`r-${b.id}`} inputMode="numeric" value={retenue} onChange={(e) => setRetenue(e.target.value.replace(/[^\d]/g, ''))} />
      {erreur && <div className="ad-err" role="alert">{erreur}</div>}
      <Button variant="green" block disabled={envoi} onClick={trancher}>{envoi ? 'Un instant…' : 'Trancher le litige'}</Button>
    </article>
  )
}

function VersementCarte({ v, onChange }) {
  const [ref, setRef] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  async function verser() {
    setEnvoi(true); setErreur('')
    try { await marquerVerse(v.id, ref.trim()); onChange() } catch (e) { setErreur(messageErreur(e)); setEnvoi(false) }
  }
  return (
    <article className="ad-card">
      <div className="ad-head"><div><div className="ad-title">{TYPE_VERS[v.kind] || v.kind}</div><div className="ad-muted">Depuis le {dateHeure(v.created_at)}</div></div><div className="ad-prix">{fcfa(v.amount)}</div></div>
      {v.note && <div className="ad-muted">{v.note}</div>}
      <Contact p={v._personne} />
      <Input placeholder="Référence du transfert (facultatif)" value={ref} onChange={(e) => setRef(e.target.value)} maxLength={120} />
      {erreur && <div className="ad-err" role="alert">{erreur}</div>}
      <Button variant="green" block disabled={envoi} onClick={verser}>{envoi ? 'Un instant…' : "J'ai envoyé l'argent"}</Button>
    </article>
  )
}

function Chiffres() {
  const { data, loading, error, reload } = useLoad(chiffres, [])
  if (loading) return <Loading lines={2} />
  if (error) return <ErrorState message={messageErreur(error)} onRetry={reload} />
  return (
    <>
      <div className="ad-grid">
        <div><small>Commission LOKAA</small><strong>{fcfa(data.commission)}</strong></div>
        <div><small>Locations payées</small><strong>{fcfa(data.volume)}</strong></div>
        {Object.entries(STATUTS).map(([k, l]) => <div key={k}><small>{l}</small><strong>{data.parStatut[k] || 0}</strong></div>)}
      </div>
      <p className="ad-muted">Commission et locations payées : réservations payées, en cours ou terminées. {data.tronque && 'Résultat limité aux 5 000 dernières.'}</p>
    </>
  )
}

export default function TeamPage() {
  const garde = useLoad(suisAdmin, [])
  const [onglet, setOnglet] = useState('annonces')
  if (garde.loading) return <Loading />
  if (garde.error) return <ErrorState message={messageErreur(garde.error)} onRetry={garde.reload} />
  if (!garde.data) return <div className="page"><EmptyState title="Espace réservé" text="Cette partie est réservée à l'équipe LOKAA." action={<Button to="/" variant="green">Retour à l'accueil</Button>} /></div>

  const onglets = [['annonces', 'Annonces'], ['litiges', 'Litiges'], ['versements', 'Versements'], ['chiffres', 'Chiffres']]
  return (
    <div className="page">
      <h1>Équipe LOKAA</h1>
      <div className="ad-tabs" role="tablist">
        {onglets.map(([k, l]) => <button key={k} role="tab" aria-selected={onglet === k} className="ad-tab" onClick={() => setOnglet(k)}>{l}</button>)}
      </div>
      {onglet === 'annonces' && <Chargeur cle="a" charger={annoncesAValider} vide={<EmptyState title="Aucune annonce à valider" text="Tout est à jour." />} rendu={(a, r) => <AnnonceCarte key={a.id} a={a} onChange={r} />} />}
      {onglet === 'litiges' && <Chargeur cle="l" charger={litiges} vide={<EmptyState title="Aucun litige" text="Aucune caution n'est contestée." />} rendu={(b, r) => <LitigeCarte key={b.id} b={b} onChange={r} />} />}
      {onglet === 'versements' && <Chargeur cle="v" charger={versementsAFaire} vide={<EmptyState title="Aucun versement à faire" text="Tout a été envoyé." />} rendu={(v, r) => <VersementCarte key={v.id} v={v} onChange={r} />} />}
      {onglet === 'chiffres' && <Chiffres />}
    </div>
  )
}
