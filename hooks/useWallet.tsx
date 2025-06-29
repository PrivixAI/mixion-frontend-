"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getChainConfig } from "@/lib/blockchain"

interface WalletContextType {
  account: string | null
  chainId: number | null
  setAccount: (account: string | null) => void
  setChainId: (chainId: number | null) => void
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)

  useEffect(() => {
    // Check if wallet was previously connected
    const wasConnected = localStorage.getItem("mixion-wallet-connected")

    if (wasConnected && window.ethereum) {
      // Try to reconnect
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0])
            // Get current chain ID
            window.ethereum.request({ method: "eth_chainId" }).then((chainId: string) => {
              const newChainId = Number.parseInt(chainId, 16)
              setChainId(newChainId)
              localStorage.setItem("mixion-chain-id", newChainId.toString())
            })
          }
        })
        .catch(console.error)
    }

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          setAccount(accounts[0])
          localStorage.setItem("mixion-wallet-connected", "true")
        }
      }

      const handleChainChanged = (chainId: string) => {
        const newChainId = Number.parseInt(chainId, 16)
        console.log("Chain changed to:", newChainId)

        setChainId(newChainId)
        localStorage.setItem("mixion-chain-id", newChainId.toString())

        // Check if the new chain is supported
        const chainConfig = getChainConfig(newChainId)
        if (!chainConfig) {
          console.warn("Switched to unsupported chain:", newChainId)
          // Don't redirect automatically, just update the state
          // The app will handle unsupported chains in individual pages
        } else {
          console.log("Switched to supported chain:", chainConfig.name)
          // Force a page reload to ensure all components update with new chain
          window.location.reload()
        }
      }

      const handleConnect = () => {
        console.log("Wallet connected")
      }

      const handleDisconnect = () => {
        console.log("Wallet disconnected")
        disconnect()
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("connect", handleConnect)
      window.ethereum.on("disconnect", handleDisconnect)

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
          window.ethereum.removeListener("chainChanged", handleChainChanged)
          window.ethereum.removeListener("connect", handleConnect)
          window.ethereum.removeListener("disconnect", handleDisconnect)
        }
      }
    }
  }, [])

  const disconnect = () => {
    setAccount(null)
    setChainId(null)
    localStorage.removeItem("mixion-wallet-connected")
    localStorage.removeItem("mixion-chain-id")
  }

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        setAccount,
        setChainId,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
