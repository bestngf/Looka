import { useEffect } from 'react'
import './layout.css'

export default function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="splash" aria-hidden="true">
      <div className="splash-ngf">NGF</div>
      <div className="splash-sub">New Generation Form</div>
      <div className="kente splash-kente" />
    </div>
  )
}
