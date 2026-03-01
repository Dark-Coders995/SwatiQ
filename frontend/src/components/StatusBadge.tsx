import './StatusBadge.css'

type StatusBadgeProps = {
  label: string
  variant?: 'active' | 'low' | 'expired' | 'out'
}

export function StatusBadge({ label, variant = 'active' }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${variant}`}>{label}</span>
}

