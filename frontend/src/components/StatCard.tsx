import './StatCard.css'

type StatCardProps = {
  title: string
  value: string
  subtitle?: string
  accent?: 'green' | 'blue' | 'orange' | 'purple'
  badgeText?: string
}

export function StatCard({ title, value, subtitle, accent = 'green', badgeText }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {badgeText && <span className="stat-card-badge">{badgeText}</span>}
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  )
}

