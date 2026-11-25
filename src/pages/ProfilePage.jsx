import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, ErrorState, Field, Input, Loading } from '../components/ui/ui'
import { useAuth } from '../features/auth/AuthContext'
import { MIN_CODE_LENGTH } from '../config'
import '../features/auth/auth.css'

const TYPES = { customer: 'Client', owner: 'Propriétaire', transporter: 'Transporteur' }

export default function ProfilePage() {
  const { profile, profileStatus, refreshProfile } = useAuth()
  const [f, setF] = useState({ nom: '', tel: '', ville: '', type: 'customer' })
  const [msg, setMsg] = useState({ kind: '', text: '' })
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [codeMsg, setCodeMsg] = useState({ kind: '', text: '' })

  useEffect(() => {
    if (profile) setF({ nom: profile.full_name || '', tel: profile.phone || '', ville: profile.city || '', type: profile.account_type || 'customer' })
  }, [profile])

  if (profileStatus === 'loading') return <Loading />
  if (profileStatus === 'error') return <div className="page"><ErrorState message="Impossible de charger ton profil." onRetry={refreshProfile} /></div>

  async function save(e) {
    e.preventDefault()
    setBusy(true); setMsg({ kind: '', text: '' })
    const { error } = await supabase.rpc('lokaa_mon_profil', { p_nom: f.nom.trim(), p_tel: f.tel.trim(), p_ville: f.ville.trim(), p_type: f.type })
    setBusy(false)
    if (error) return setMsg({ kind: 'error', text: "Ton profil n'a pas pu être enregistré. Réessaie." })
    setMsg({ kind: 'ok', text: 'Profil enregistré.' })
    refreshProfile()
  }
  async function changeCode(e) {
    e.preventDefault()
    if (code.length < MIN_CODE_LENGTH) return setCodeMsg({ kind: 'error', text: `Le code doit avoir au moins ${MIN_CODE_LENGTH} caractères.` })
    const { error } = await supabase.auth.updateUser({ password: code })
    if (error) return setCodeMsg({ kind: 'error', text: "Le code n'a pas pu être changé. Réessaie." })
    setCode(''); setCodeMsg({ kind: 'ok', text: 'Code changé.' })
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <div className="auth-wrap">
      <h1>Mon profil</h1>
      {profileStatus === 'empty' && <p className="lead">Complète ton profil pour pouvoir réserver ou louer.</p>}
      {profile?.username && <p className="lead">Identifiant : <strong>{profile.username}</strong></p>}
      <Card>
        <form onSubmit={save}>
          <Field label="Nom complet"><Input value={f.nom} onChange={set('nom')} required /></Field>
          <Field label="Téléphone" hint="Avec l'indicatif, par exemple 22890123456."><Input type="tel" inputMode="tel" value={f.tel} onChange={set('tel')} required /></Field>
          <Field label="Ville"><Input value={f.ville} onChange={set('ville')} required /></Field>
          <Field label="Type de compte">
            <select className="input" value={f.type} onChange={set('type')}>
              {Object.entries(TYPES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </Field>
          {msg.text && <p className={msg.kind === 'ok' ? 'msg-ok' : 'msg-error'} role="status">{msg.text}</p>}
          <Button block disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </form>
      </Card>
      <Card>
        <h2>Changer mon code</h2>
        <form onSubmit={changeCode}>
          <Field label="Nouveau code secret"><Input type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="new-password" /></Field>
          {codeMsg.text && <p className={codeMsg.kind === 'ok' ? 'msg-ok' : 'msg-error'} role="status">{codeMsg.text}</p>}
          <Button block variant="green">Changer le code</Button>
        </form>
      </Card>
    </div>
  )
}
