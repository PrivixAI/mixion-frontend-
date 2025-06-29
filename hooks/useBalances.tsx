"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useWallet } from "./useWallet"
import { getChainConfig, getBalance, getERC20Balance } from "@/lib/blockchain"
import { getCustomTokens } from "@/lib/storage"

export function useBalances() {
  const { account, chainId } = useWallet()
  const [nativeBalance, setNativeBalance] = useState("0")
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const lastUpdateRef = useRef<number>(0)

  // Debounced update function to prevent rapid updates
  const debouncedUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      const now = Date.now()
      // Only update if at least 2 seconds have passed since last update
      if (now - lastUpdateRef.current > 2000) {
        updateBalances()
        lastUpdateRef.current = now
      }
    }, 1000) // 1 second debounce
  }, [account, chainId])

  useEffect(() => {
    if (!account || !chainId) {
      setNativeBalance("0")
      setBalances({})
      return
    }

    // Initial load
    updateBalances()

    // Set up WebSocket for live updates with debouncing
    const chainConfig = getChainConfig(chainId)
    if (chainConfig?.wsUrl) {
      // Clean up existing WebSocket
      if (wsRef.current) {
        wsRef.current.close()
      }

      const ws = new WebSocket(chainConfig.wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        // Subscribe to new blocks
        ws.send(
          JSON.stringify({
            id: 1,
            method: "eth_subscribe",
            params: ["newHeads"],
          }),
        )
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.method === "eth_subscription") {
          // New block received, debounced update
          debouncedUpdate()
        }
      }

      ws.onerror = (error) => {
        console.warn("WebSocket error:", error)
      }

      return () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }
        if (wsRef.current) {
          wsRef.current.close()
        }
      }
    }
  }, [account, chainId, debouncedUpdate])

  const updateBalances = async () => {
    if (!account || !chainId) return

    setLoading(true)

    try {
      const chainConfig = getChainConfig(chainId)
      if (!chainConfig) return

      // Update native balance
      const newNativeBalance = await getBalance(account)

      // Only update if balance actually changed
      setNativeBalance((prev) => {
        if (prev !== newNativeBalance) {
          return newNativeBalance
        }
        return prev
      })

      // Update ERC20 balances
      const newBalances: Record<string, string> = {}

      // Get balances for default tokens (excluding native)
      const defaultTokens = chainConfig.tokens.slice(1)
      for (const token of defaultTokens) {
        try {
          const balance = await getERC20Balance(token.address, account)
          newBalances[token.address] = balance
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error)
          newBalances[token.address] = "0"
        }
      }

      // Get balances for custom tokens
      const customTokens = getCustomTokens(chainId)
      for (const token of customTokens) {
        try {
          const balance = await getERC20Balance(token.address, account)
          newBalances[token.address] = balance
        } catch (error) {
          console.error(`Error fetching balance for custom token ${token.symbol}:`, error)
          newBalances[token.address] = "0"
        }
      }

      // Only update if balances actually changed
      setBalances((prev) => {
        const hasChanged =
          Object.keys(newBalances).some((key) => prev[key] !== newBalances[key]) ||
          Object.keys(prev).length !== Object.keys(newBalances).length

        if (hasChanged) {
          return newBalances
        }
        return prev
      })
    } catch (error) {
      console.error("Error updating balances:", error)
    } finally {
      setLoading(false)
    }
  }

  return {
    nativeBalance,
    balances,
    loading,
    updateBalances,
  }
}
