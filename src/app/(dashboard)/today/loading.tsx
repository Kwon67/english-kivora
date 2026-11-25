export default function Loading() {
  return (
    <section className="workspace-route-loading" role="status" aria-busy="true">
      <h1 className="text-2xl font-medium">Hoje</h1>
      <p>Preparando sua prática…</p>
      <div className="workspace-route-loading-block" aria-hidden="true" />
    </section>
  )
}
