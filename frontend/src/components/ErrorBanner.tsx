import type { ApiError } from '../api/client'
import './ErrorBanner.css'
import { Button } from './Button'

export function ErrorBanner({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div className="error-banner" role="alert">
      <div className="error-title">{error.message}</div>
      <div className="error-meta">Code: {error.code}</div>
      {onRetry && (
        <div className="error-actions">
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}

