import { RotateCcw } from 'lucide-react'

export default function RetryOfflineButton() {
  return (
    <form action="/offline" method="get">
      <button type="submit" className="btn-primary">
        <RotateCcw className="h-4 w-4" strokeWidth={2} />
        Tentar novamente
      </button>
    </form>
  )
}
