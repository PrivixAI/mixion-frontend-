"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Wallet, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { connectWallet, switchChain, getChainConfig } from "@/lib/blockchain"
import { useWallet } from "@/hooks/useWallet"
import config from "@/config.json"

export default function ConnectWalletPage() {
  const router = useRouter()
  const { account, chainId, setAccount, setChainId } = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const [connectedChain, setConnectedChain] = useState(null)
  const [needsSwitch, setNeedsSwitch] = useState(false)

  useEffect(() => {
    if (account && chainId) {
      const chainConfig = getChainConfig(chainId)
      if (chainConfig) {
        router.push("/dashboard")
      }
    }
  }, [account, chainId, router])

  const handleConnect = async () => {
    setIsConnecting(true)
    setError("")
    setNeedsSwitch(false)

    try {
      const { account: connectedAccount, chainId: connectedChainId } = await connectWallet()

      const chainConfig = getChainConfig(connectedChainId)
      if (!chainConfig) {
        // Unsupported chain - show switch options
        setConnectedChain({ chainId: connectedChainId, account: connectedAccount })
        setNeedsSwitch(true)
        setError(`Current network is not supported. Please switch to one of our supported networks.`)
        return
      }

      setAccount(connectedAccount)
      setChainId(connectedChainId)

      // Store connection in localStorage
      localStorage.setItem("mixion-wallet-connected", "true")
      localStorage.setItem("mixion-chain-id", connectedChainId.toString())

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSwitchChain = async (targetChainId: number) => {
    setIsConnecting(true)
    setError("")

    try {
      await switchChain(targetChainId)

      // After switching, the wallet hook will automatically detect the change
      // and update the chainId, which will trigger the redirect to dashboard
      const chainConfig = getChainConfig(targetChainId)
      if (chainConfig && connectedChain) {
        setAccount(connectedChain.account)
        setChainId(targetChainId)

        localStorage.setItem("mixion-wallet-connected", "true")
        localStorage.setItem("mixion-chain-id", targetChainId.toString())

        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Failed to switch network")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <motion.div
          className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Back Button */}
        <motion.div
          className="absolute top-6 left-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button variant="ghost" onClick={() => router.push("/")} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </motion.div>

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader className="text-center">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Wallet className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl text-white">Connect Your Wallet</CardTitle>
              <p className="text-gray-300">Connect your wallet to start using MixionLocker</p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert className="bg-red-500/10 border-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Network Switch Options */}
              {needsSwitch && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <p className="text-gray-300 text-sm text-center">Choose a supported network:</p>
                  <div className="grid grid-cols-1 gap-3">
                    {config.chains.map((chain) => (
                      <motion.div key={chain.chainId} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card
                          className="cursor-pointer transition-all duration-200 bg-white/5 border-white/10 hover:bg-white/10"
                          onClick={() => handleSwitchChain(chain.chainId)}
                        >
                          <CardContent className="p-4 flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{chain.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{chain.name}</p>
                              <p className="text-gray-400 text-sm">{chain.symbol}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Connect Button */}
              {!needsSwitch && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full glass-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-6 text-lg rounded-xl"
                  >
                    {isConnecting ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                    ) : (
                      "Connect with MetaMask"
                    )}
                  </Button>
                </motion.div>
              )}

              <p className="text-center text-sm text-gray-400">Make sure you have MetaMask installed and unlocked</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
