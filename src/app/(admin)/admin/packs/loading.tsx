function PackCardSkeleton() {
  return (
    <div className="rounded-[0.9rem] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="h-4 w-4 rounded bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 h-5 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-full rounded bg-gray-200" />
      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="h-3 w-20 rounded bg-gray-200" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-7 w-44 rounded-md bg-gray-200" />
          <div className="mt-2 h-4 w-80 rounded-md bg-gray-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-md bg-gray-200" />
          <div className="h-10 w-28 rounded-md bg-gray-200" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 rounded-[0.9rem] border border-gray-100 bg-white p-4 shadow-sm">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="mt-3 h-7 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="h-24 rounded-[1rem] border border-gray-100 bg-white shadow-sm" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <PackCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
