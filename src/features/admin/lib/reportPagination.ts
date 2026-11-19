/** Reports must not silently treat PostgREST's first 1,000 rows as the whole population. */
export async function readReportPages<T>(readPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = []
  for (let offset = 0; ; offset += 1000) {
    const result = await readPage(offset, offset + 999)
    if (result.error) return { data: null, error: result.error }
    rows.push(...(result.data ?? []))
    if (!result.data || result.data.length < 1000) return { data: rows, error: null }
  }
}
