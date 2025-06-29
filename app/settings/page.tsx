"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Trash2, Plus, Wallet, Shield, Database, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWallet } from "@/hooks/useWallet"
import { getChainConfig, formatAddress } from "@/lib/blockchain"
import { getCustomTokens, removeCustomToken, clearTransactionHistory } from "@/lib/storage"
import { AddTokenModal } from "@/components/AddTokenModal"

export default function SettingsPage() {
  const router = useRouter()
  const { account, chainId, disconnect } = useWallet()
  const [customTokens, setCustomTokens] = useState([])
  const [showAddToken, setShowAddToken] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const chainConfig = chainId ? getChainConfig(chainId) : null

  useEffect(() => {
    if (!account || !chainId) {
      router.push("/connect-wallet")
      return
    }

    loadCustomTokens()
  }, [account, chainId, router])

  const loadCustomTokens = () => {
    if (chainId) {
      const tokens = getCustomTokens(chainId)
      setCustomTokens(tokens)
    }
  }

  const handleRemoveToken = (tokenAddress) => {
    removeCustomToken(chainId, tokenAddress)
    loadCustomTokens()
  }

  const handleClearHistory = () => {
    clearTransactionHistory()
    setShowClearConfirm(false)
  }

  const handleDisconnect = () => {
    disconnect()
    router.push("/")
  }

  if (!account || !chainId || !chainConfig) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <motion.div
          className="absolute top-1/3 right-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header
          className="p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-gray-400">Manage your MixionLocker preferences</p>
            </div>
          </div>
        </motion.header>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Wallet Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Wallet Information</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Connected Address</label>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white font-mono">{formatAddress(account, 20)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Current Network</label>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white">{chainConfig.name}</p>
                      <p className="text-gray-400 text-sm">{chainConfig.symbol}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleDisconnect}
                  variant="destructive"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                >
                  Disconnect Wallet
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Custom Tokens */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Custom Tokens</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddToken(true)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Token
                </Button>
              </CardHeader>

              <CardContent>
                {customTokens.length > 0 ? (
                  <div className="space-y-3">
                    {customTokens.map((token) => (
                      <div
                        key={token.address}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{token.symbol}</p>
                            <p className="text-gray-400 text-sm">{token.name}</p>
                            <p className="text-gray-500 text-xs font-mono">{formatAddress(token.address)}</p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveToken(token.address)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No custom tokens added</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddToken(true)}
                      className="text-blue-400 hover:text-blue-300 mt-2"
                    >
                      Add Your First Token
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Transaction History</h3>
                  <p className="text-gray-400 text-sm">Clear all cached transaction history from local storage</p>

                  {!showClearConfirm ? (
                    <Button
                      onClick={() => setShowClearConfirm(true)}
                      variant="destructive"
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                    >
                      Clear Transaction History
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Alert className="bg-red-500/10 border-red-500/20">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300">
                          This action cannot be undone. All transaction history will be permanently deleted.
                        </AlertDescription>
                      </Alert>

                      <div className="flex space-x-3">
                        <Button
                          onClick={handleClearHistory}
                          variant="destructive"
                          size="sm"
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                        >
                          Confirm Clear
                        </Button>
                        <Button
                          onClick={() => setShowClearConfirm(false)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Privacy Notice:</strong> All data is stored locally in your browser. MixionLocker does not
                collect or store any personal information on external servers.
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </div>

      {/* Add Token Modal */}
      <AddTokenModal
        isOpen={showAddToken}
        onClose={() => {
          setShowAddToken(false)
          loadCustomTokens()
        }}
        chainId={chainId}
      />
    </div>
  )
}
