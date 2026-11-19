/** The SQL reservation subtracts settled spend and outstanding claims from this ceiling. */
export function creditCeiling(approved: number, balance: number, minimumBalance?: number) {
  if (![approved, balance, minimumBalance ?? 0].every((n) => Number.isSafeInteger(n) && n >= 0))
    throw Error('Dados de orçamento inválidos.')
  const available = minimumBalance === undefined ? Math.floor(balance * 0.6) : balance - minimumBalance
  return Math.max(0, Math.min(approved, available))
}

/**
 * Subscription reads are rate-limited and may lag receipts. Between fresh reads,
 * deduct the full maximum of each admitted request, including unconfirmed ones.
 * Shared SQL reservations still account for all other publisher instances.
 */
export function batchBalance(read: () => Promise<number>, now = Date.now) {
  let expiresAt = 0
  let balance = 0
  let committed = 0
  return async (maximum: number, floor: number) => {
    if (now() >= expiresAt || committed + maximum > 400 || balance - committed - maximum < floor) {
      expiresAt = 0
      balance = await read()
      committed = 0
      expiresAt = now() + 8_000
    }
    const available = balance - committed
    committed += maximum
    return available
  }
}
