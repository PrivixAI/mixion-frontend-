interface Transaction {
  txHash: string
  type: "lock" | "unlock"
  amount: string
  currency: string
  chainId: number
  timestamp: number
  secret?: string
}

interface CustomToken {
  name: string
  symbol: string
  address: string
  decimals: number
  logoUri: string
}

const STORAGE_KEYS = {
  TRANSACTIONS: "mixion-transactions",
  CUSTOM_TOKENS: "mixion-custom-tokens",
}

export function saveTransaction(transaction: Transaction): void {
  try {
    const existing = getTransactionHistory()
    const updated = [transaction, ...existing].slice(0, 100) // Keep last 100 transactions
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated))
  } catch (error) {
    console.error("Error saving transaction:", error)
  }
}

export function getTransactionHistory(): Transaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error loading transaction history:", error)
    return []
  }
}

export function clearTransactionHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS)
  } catch (error) {
    console.error("Error clearing transaction history:", error)
  }
}

export function saveCustomToken(chainId: number, token: CustomToken): void {
  try {
    const existing = getCustomTokens(chainId)

    // Check if token already exists
    const exists = existing.find((t) => t.address.toLowerCase() === token.address.toLowerCase())
    if (exists) {
      throw new Error("Token already added")
    }

    const updated = [...existing, token]
    const allTokens = getAllCustomTokens()
    allTokens[chainId] = updated

    localStorage.setItem(STORAGE_KEYS.CUSTOM_TOKENS, JSON.stringify(allTokens))
  } catch (error) {
    console.error("Error saving custom token:", error)
    throw error
  }
}

export function getCustomTokens(chainId: number): CustomToken[] {
  try {
    const allTokens = getAllCustomTokens()
    return allTokens[chainId] || []
  } catch (error) {
    console.error("Error loading custom tokens:", error)
    return []
  }
}

export function removeCustomToken(chainId: number, tokenAddress: string): void {
  try {
    const existing = getCustomTokens(chainId)
    const updated = existing.filter((t) => t.address.toLowerCase() !== tokenAddress.toLowerCase())

    const allTokens = getAllCustomTokens()
    allTokens[chainId] = updated

    localStorage.setItem(STORAGE_KEYS.CUSTOM_TOKENS, JSON.stringify(allTokens))
  } catch (error) {
    console.error("Error removing custom token:", error)
  }
}

function getAllCustomTokens(): Record<number, CustomToken[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_TOKENS)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error("Error loading all custom tokens:", error)
    return {}
  }
}
