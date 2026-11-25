import { STATUS_LABELS } from './format'

export default function StatusBadge({ status }) {
  return <span className={`bk-badge bk-badge--${status}`}>{STATUS_LABELS[status] || status}</span>
}
