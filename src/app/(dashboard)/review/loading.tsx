export default function Loading() {
  return <section className="workspace-route-loading" role="status" aria-busy="true" aria-live="polite">
    <h1 className="text-2xl font-medium">Revisar</h1>
    <p>Preparando suas revisões…</p>
    <div className="workspace-route-loading-block" aria-hidden="true" />
  </section>
}
