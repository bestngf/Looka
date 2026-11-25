import { Link } from 'react-router-dom'
import { Inbox, WifiOff } from 'lucide-react'
import './ui.css'

export function Button({ variant = 'gold', block, to, className = '', children, ...p }) {
  const cls = `btn btn-${variant} ${block ? 'btn-block' : ''} ${className}`
  if (to) return <Link to={to} className={cls} {...p}>{children}</Link>
  return <button className={cls} {...p}>{children}</button>
}
export const Card = ({ children, className = '' }) => <section className={`card ${className}`}>{children}</section>

export function Skeleton({ height = 18, width = '100%' }) {
  return <div className="skel" style={{ height, width }} aria-hidden="true" />
}
export function Loading({ lines = 3 }) {
  return (
    <div className="page" role="status" aria-label="Chargement en cours">
      <Skeleton height={28} width="60%" />
      <div style={{ height: 14 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ marginBottom: 12 }}><Skeleton height={64} /></div>
      ))}
    </div>
  )
}
export function ErrorState({ message = "Quelque chose s'est mal passé.", onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <WifiOff size={36} aria-hidden="true" />
      <h2>Oups</h2>
      <p>{message}</p>
      {onRetry && <Button variant="green" onClick={onRetry}>Réessayer</Button>}
    </div>
  )
}
export function EmptyState({ title = 'Rien à voir ici', text, action }) {
  return (
    <div className="state">
      <Inbox size={36} aria-hidden="true" />
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}
export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}
export const Input = (p) => <input className="input" {...p} />
