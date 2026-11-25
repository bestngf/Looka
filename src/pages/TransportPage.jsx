import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Navigation, PackageCheck, Phone, MessageCircle } from 'lucide-react'
import { Button, EmptyState, ErrorState, Loading } from '../components/ui/ui'
import { useAuth } from '../features/auth/AuthContext'
import { useLoad, fcfa, dateHeure, messageErreur, lienAppel, lienWhatsApp } from '../features/transport/utils'
import {
  livraisonsAPrendre, mesLivraisons, mesGains, prendreLivraison, changerStatut, contactsLivraison, devenirTransporteur,
} from '../services/transport'
import '../features/transport/transport.css'

const TYPE = { delivery: 'Livraison chez le client', collection: 'Récupération chez le client' }
const STATUT = { assigned: 'À faire', in_transit: 'En route', delivered: 'Livrée', cancelled: 'Annulée' }

function Trajet({ d }) {
  return (
    <div className="tp-route">
      <div><span>Départ</span><div>{d.pickup_address || 'Adresse à confirmer'}</div></div>
      <div><span>Arrivée</span><div>{d.destination_address || 'Adresse à confirmer'}</div></div>
    </div>
  )
}

function CarteAPrendre({ d, onChange }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  async function prendre() {
    setEnvoi(true); setErreur('')
    try { await prendreLivraison(d.id); onChange() } catch (e) { setErreur(messageErreur(e)); setEnvoi(false) }
  }
  return (
    <article className="tp-card">
      <div className="tp-head"><div className="tp-type">{TYPE[d.delivery_type] || 'Course'}</div><div className="tp-prix">{fcfa(d.fee)}</div></div>
      <Trajet d={d} />
      <div className="tp-note">Demandée {dateHeure(d.created_at)}. Une petite commission LOKAA est retenue sur le prix.</div>
      {erreur && <div className="tp-err" role="alert">{erreur}</div>}
      <Button variant="green" block disabled={envoi} onClick={prendre}>{envoi ? 'Un instant…' : 'Prendre cette course'}</Button>
    </article>
  )
}

function CarteMaCourse({ d, onChange }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [contacts, setContacts] = useState(null)
  const actif = d.status === 'assigned' || d.status === 'in_transit'

  async function statut(s) {
    if (s === 'delivered' && !window.confirm('Confirmer que la course est terminée ?')) return
    setEnvoi(true); setErreur('')
    try { await changerStatut(d.id, s); onChange() } catch (e) { setErreur(messageErreur(e)); setEnvoi(false) }
  }
  async function voirContacts() {
    setErreur('')
    try { setContacts(await contactsLivraison(d.id)) } catch (e) { setErreur(messageErreur(e)) }
  }
  const Contact = ({ nom, tel, role }) => (
    <div>
      <strong>{role} : {nom || 'Sans nom'}</strong>
      {tel ? (
        <div className="tp-actions">
          <a href={lienAppel(tel)}><Phone size={16} aria-hidden="true" /> {tel}</a>
          <a href={lienWhatsApp(tel)} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true" /> WhatsApp</a>
        </div>
      ) : <div className="tp-note">Numéro non renseigné</div>}
    </div>
  )

  return (
    <article className="tp-card">
      <div className="tp-head">
        <div><div className="tp-type">{TYPE[d.delivery_type] || 'Course'}</div><span className={`tp-pill ${d.status === 'delivered' ? 'ok' : ''}`}>{STATUT[d.status] || d.status}</span></div>
        <div className="tp-prix">{fcfa(d.fee)}</div>
      </div>
      <Trajet d={d} />
      {actif && !contacts && <Button variant="surface" block onClick={voirContacts}>Voir les contacts</Button>}
      {contacts && (
        <div className="tp-contact">
          <Contact role="Client" nom={contacts.client_nom} tel={contacts.client_tel} />
          <Contact role="Propriétaire" nom={contacts.proprietaire_nom} tel={contacts.proprietaire_tel} />
        </div>
      )}
      {erreur && <div className="tp-err" role="alert">{erreur}</div>}
      {actif && (
        <div className="tp-actions">
          {d.status === 'assigned' && <Button variant="surface" disabled={envoi} onClick={() => statut('in_transit')}><Navigation size={16} aria-hidden="true" /> Je suis en route</Button>}
          <Button variant="green" disabled={envoi} onClick={() => statut('delivered')}><PackageCheck size={16} aria-hidden="true" /> C'est livré</Button>
        </div>
      )}
      {d.status === 'delivered' && <div className="tp-note">Terminée {dateHeure(d.completed_at)}.</div>}
    </article>
  )
}

function Gains({ uid }) {
  const { data, loading, error, reload } = useLoad(() => mesGains(uid), [uid])
  if (loading) return <Loading lines={2} />
  if (error) return <ErrorState message={messageErreur(error)} onRetry={reload} />
  const avenir = data.filter((g) => g.status === 'pending').reduce((s, g) => s + Number(g.amount), 0)
  const verse = data.filter((g) => g.status === 'paid').reduce((s, g) => s + Number(g.amount), 0)
  return (
    <>
      <div className="tp-sum">
        <div><small>À recevoir</small><strong>{fcfa(avenir)}</strong></div>
        <div><small>Déjà reçu</small><strong>{fcfa(verse)}</strong></div>
      </div>
      {data.length === 0
        ? <EmptyState title="Pas encore de gains" text="Dès qu'une course est livrée, ton gain apparaît ici." />
        : <div className="tp-list">{data.map((g) => (
            <article className="tp-card" key={g.id}>
              <div className="tp-head"><div>Course livrée</div><div className="tp-prix">{fcfa(g.amount)}</div></div>
              <span className={`tp-pill ${g.status === 'paid' ? 'ok' : ''}`}>{g.status === 'paid' ? `Reçu ${dateHeure(g.paid_at)}` : 'À recevoir'}</span>
            </article>
          ))}</div>}
    </>
  )
}

function Liste({ charger, vide, rendu }) {
  const { data, loading, error, reload } = useLoad(charger, [])
  if (loading) return <Loading lines={2} />
  if (error) return <ErrorState message={messageErreur(error)} onRetry={reload} />
  if (!data.length) return vide
  return <div className="tp-list">{data.map((d) => rendu(d, reload))}</div>
}

export default function TransportPage() {
  const { user, profile, profileStatus, refreshProfile } = useAuth()
  const [onglet, setOnglet] = useState('prendre')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  if (profileStatus === 'loading') return <Loading />
  if (profileStatus === 'error') return <ErrorState message="Impossible de charger ton profil." onRetry={refreshProfile} />
  if (!profile) {
    return <div className="page"><EmptyState title="Complète ton profil" text="Il faut d'abord créer ton profil." action={<Button to="/profil" variant="green">Mon profil</Button>} /></div>
  }
  if (profile.account_type !== 'transporter') {
    async function devenir() {
      setEnvoi(true); setErreur('')
      try { await devenirTransporteur(profile); await refreshProfile() } catch (e) { setErreur(messageErreur(e)); setEnvoi(false) }
    }
    return (
      <div className="page">
        <EmptyState
          title="Gagne de l'argent en livrant"
          text="Prends des courses de livraison et de récupération de matériel près de chez toi. Tu es payé pour chaque course terminée."
          action={<><Button variant="gold" disabled={envoi} onClick={devenir}><Truck size={18} aria-hidden="true" /> {envoi ? 'Un instant…' : 'Devenir transporteur'}</Button>{erreur && <p className="tp-err" role="alert">{erreur}</p>}</>}
        />
      </div>
    )
  }

  const onglets = [['prendre', 'À prendre'], ['courses', 'Mes courses'], ['gains', 'Mes gains']]
  return (
    <div className="page">
      <h1>Espace transporteur</h1>
      <div className="tp-tabs" role="tablist">
        {onglets.map(([k, l]) => <button key={k} role="tab" aria-selected={onglet === k} className="tp-tab" onClick={() => setOnglet(k)}>{l}</button>)}
      </div>
      {onglet === 'prendre' && (
        <Liste key="p" charger={livraisonsAPrendre}
          vide={<EmptyState title="Aucune course pour le moment" text="Les nouvelles livraisons apparaissent ici dès qu'un client a payé. Reviens bientôt." />}
          rendu={(d, reload) => <CarteAPrendre key={d.id} d={d} onChange={reload} />} />
      )}
      {onglet === 'courses' && (
        <Liste key="c" charger={() => mesLivraisons(user.id)}
          vide={<EmptyState title="Aucune course" text="Prends une course dans « À prendre »." action={<Button variant="green" onClick={() => setOnglet('prendre')}>Voir les courses</Button>} />}
          rendu={(d, reload) => <CarteMaCourse key={d.id} d={d} onChange={reload} />} />
      )}
      {onglet === 'gains' && <Gains uid={user.id} />}
      <p className="tp-note">Besoin d'aide ? <Link to="/profil">Mon profil</Link></p>
    </div>
  )
}
