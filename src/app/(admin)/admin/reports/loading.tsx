export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-7 w-56 rounded-md bg-gray-200" />
          <div className="mt-2 h-4 w-80 rounded-md bg-gray-200" />
        </div>
        <div className="h-10 w-32 rounded-md bg-gray-200" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 rounded-[0.9rem] border border-gray-100 bg-white p-4 shadow-sm">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="mt-3 h-7 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="h-72 rounded-[1rem] border border-gray-100 bg-white shadow-sm" />
      <div className="h-80 rounded-[1rem] border border-gray-100 bg-white shadow-sm" />
    </div>
  )
}
