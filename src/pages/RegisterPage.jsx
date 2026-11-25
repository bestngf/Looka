import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, Field, Input } from '../components/ui/ui'
import { useAuth } from '../features/auth/AuthContext'
import { checkUsername, signUp, login, cleanUsername, isUsernameValid } from '../features/auth/authApi'
import { MIN_CODE_LENGTH } from '../config'
import '../features/auth/auth.css'

const ROLES = [
  { v: 'customer', t: 'Client', d: 'Je loue du matériel' },
  { v: 'owner', t: 'Propriétaire', d: 'Je mets mon matériel en location' },
  { v: 'transporter', t: 'Transporteur', d: 'Je livre le matériel' },
]

export default function RegisterPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [f, setF] = useState({ username: '', code: '', code2: '', full_name: '', phone: '', city: '', recovery_email: '', role: 'customer' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  if (session) return <Navigate to="/" replace />

  async function next(e) {
    e.preventDefault()
    setError('')
    const u = cleanUsername(f.username)
    if (!isUsernameValid(u)) return setError('Identifiant : 3 à 30 signes, sans espace (lettres, chiffres, . _ -).')
    if (f.code.length < MIN_CODE_LENGTH) return setError(`Le code doit avoir au moins ${MIN_CODE_LENGTH} caractères.`)
    if (f.code !== f.code2) return setError('Les deux codes ne sont pas pareils.')
    setBusy(true)
    try {
      if (!(await checkUsername(u))) setError('Cet identifiant est déjà pris.')
      else { setF({ ...f, username: u }); setStep(2) }
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function submit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const body = { username: f.username, code: f.code, full_name: f.full_name.trim(), phone: f.phone.trim(), city: f.city.trim(), role: f.role }
      if (f.recovery_email.trim()) body.recovery_email = f.recovery_email.trim()
      await signUp(body)
      await login(f.username, f.code)
      navigate('/')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="auth-wrap">
      <p className="steps">Étape {step} sur 2</p>
      <h1>Créer un compte</h1>
      {step === 1 ? (
        <form onSubmit={next}>
          <Field label="Identifiant" hint="Tu l'utiliseras pour te connecter."><Input value={f.username} onChange={set('username')} autoCapitalize="none" autoComplete="username" required /></Field>
          <Field label="Code secret" hint={`Au moins ${MIN_CODE_LENGTH} caractères.`}><Input type="password" value={f.code} onChange={set('code')} autoComplete="new-password" required /></Field>
          <Field label="Répète le code secret"><Input type="password" value={f.code2} onChange={set('code2')} autoComplete="new-password" required /></Field>
          {error && <p className="msg-error" role="alert">{error}</p>}
          <Button block disabled={busy}>{busy ? 'Vérification…' : 'Continuer'}</Button>
        </form>
      ) : (
        <form onSubmit={submit}>
          <Field label="Nom complet"><Input value={f.full_name} onChange={set('full_name')} autoComplete="name" required /></Field>
          <Field label="Téléphone" hint="Avec l'indicatif, par exemple 22890123456 (pour WhatsApp)."><Input type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" required /></Field>
          <Field label="Ville"><Input value={f.city} onChange={set('city')} placeholder="Lomé" required /></Field>
          <Field label="E-mail de secours (facultatif)" hint="Pour retrouver ton code plus tard."><Input type="email" value={f.recovery_email} onChange={set('recovery_email')} autoComplete="email" /></Field>
          <div className="roles" role="radiogroup" aria-label="Type de compte">
            {ROLES.map((r) => (
              <label key={r.v} className={`role ${f.role === r.v ? 'on' : ''}`}>
                <input type="radio" name="role" value={r.v} checked={f.role === r.v} onChange={set('role')} />
                <span><strong>{r.t}</strong><small>{r.d}</small></span>
              </label>
            ))}
          </div>
          {error && <p className="msg-error" role="alert">{error}</p>}
          <div className="row">
            <Button type="button" variant="surface" onClick={() => { setError(''); setStep(1) }}>Retour</Button>
            <Button disabled={busy}>{busy ? 'Création…' : 'Créer mon compte'}</Button>
          </div>
        </form>
      )}
      <div className="auth-links"><Link to="/connexion">J'ai déjà un compte</Link></div>
    </div>
  )
}
