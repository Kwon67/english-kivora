'use client'
/** Loading and failed reads must not be represented as a valid empty collection. */
export default function DataLoadState({ title, loading, onRetry }: { title: string; loading: boolean; onRetry: () => void }) {
  return <section className="workspace-feedback px-4" aria-busy={loading}>
    <h1 className="font-heading text-brand-dark">{title}</h1>
    {loading ? <p role="status" className="mt-4 text-brand-secondary">Carregando dados…</p> : <div role="alert" className="mt-4 text-sm leading-relaxed text-brand-secondary">
      <p>Não foi possível carregar os dados desta área. Confira a conexão e tente novamente.</p>
      <div className="workspace-feedback-actions">
        <button type="button" className="btn-primary" onClick={onRetry}>Tentar carregar novamente</button>
      </div>
    </div>}
  </section>
}
