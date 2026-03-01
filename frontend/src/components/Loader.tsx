import './Loader.css'

export function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loader">
      <span className="spinner" aria-hidden="true" />
      <span className="loader-label">{label}</span>
    </div>
  )
}

