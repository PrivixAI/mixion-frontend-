"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Wallet, Lock, Unlock, Plus, Copy, LogOut, Coins, Activity, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/hooks/useWallet"
import { useBalances } from "@/hooks/useBalances"
import { getChainConfig, formatAddress, formatBalance } from "@/lib/blockchain"
import { getTransactionHistory } from "@/lib/storage"
import { AddTokenModal } from "@/components/AddTokenModal"
import { TransactionRow } from "@/components/TransactionRow"
import LetterGlitch from "@/components/ui/LetterGlitch"

export default function DashboardPage() {
  const router = useRouter()
  const { account, chainId, disconnect } = useWallet()
  const { balances, nativeBalance, loading } = useBalances()
  const [showAddToken, setShowAddToken] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [copied, setCopied] = useState(false)
  const initialLoadRef = useRef(false)

  const chainConfig = chainId ? getChainConfig(chainId) : null

  useEffect(() => {
    if (!account || !chainId) {
      router.push("/connect-wallet")
      return
    }

    if (!chainConfig) {
      // Unsupported chain - redirect to connect wallet
      router.push("/connect-wallet")
      return
    }

    // Load transaction history
    const history = getTransactionHistory()
    setTransactions(history.slice(0, 4)) // Show last 4 transactions
  }, [account, chainId, chainConfig, router, loading])

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    router.push("/")
  }

  if (!account || !chainId) {
    return null
  }

  if (!chainConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Unsupported Network</h3>
            <p className="text-gray-300 mb-6">Please switch to a supported network to continue.</p>
            <Button onClick={() => router.push("/connect-wallet")} className="w-full">
              Switch Network
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* LetterGlitch Background */}
      <div className="absolute inset-0 z-0">
        <LetterGlitch
          glitchColors={["#2b4539", "#61dca3", "#61b3dc"]}
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
        />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen bg-gradient-to-br from-slate-900/80 via-blue-900/80 to-slate-900/80">
        {/* Header */}
        <motion.header
          className="p-6 border-b border-white/10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MixionLocker</h1>
                <p className="text-gray-400 text-sm">{chainConfig.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
                <CardContent className="p-3 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{formatAddress(account)}</p>
                    <p className="text-gray-400 text-xs">{chainConfig.symbol}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Button variant="ghost" onClick={handleDisconnect} className="text-gray-400 hover:text-white">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Balance Section */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Native Balance */}
            <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Coins className="w-5 h-5" />
                  <span>Native Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{chainConfig.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{chainConfig.symbol}</p>
                        <p className="text-gray-400 text-sm">{chainConfig.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{loading ? "..." : formatBalance(nativeBalance)}</p>
                      <p className="text-gray-400 text-sm">{chainConfig.symbol}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/lock-funds?token=${chainConfig.symbol}`)}
                    className="w-full glass-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                  >
                    Lock {chainConfig.symbol}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ERC20 Balances */}
            <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Token Balances</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddToken(true)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {chainConfig.tokens.slice(1).map((token) => {
                    const balance = balances[token.address] || "0"
                    return (
                      <div
                        key={token.address}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => router.push(`/lock-funds?token=${token.symbol}`)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">{token.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{token.symbol}</p>
                            <p className="text-gray-400 text-xs">{token.name}</p>
                          </div>
                        </div>
                        <p className="text-white font-medium">{loading ? "..." : formatBalance(balance)}</p>
                      </div>
                    )
                  })}

                  {chainConfig.tokens.length === 1 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">No tokens added yet</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddToken(true)}
                        className="text-blue-400 hover:text-blue-300 mt-2"
                      >
                        Add Token
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => router.push("/lock-funds")}
                className="w-full h-24 glass-button bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-white border border-blue-500/30 text-lg"
              >
                <Lock className="w-6 h-6 mr-3" />
                Lock Funds
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => router.push("/unlock-funds")}
                className="w-full h-24 glass-button bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-white border border-green-500/30 text-lg"
              >
                <Unlock className="w-6 h-6 mr-3" />
                Unlock Funds
              </Button>
            </motion.div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/history")}
                  className="text-blue-400 hover:text-blue-300"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((tx, index) => (
                      <TransactionRow key={index} transaction={tx} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No recent activity</p>
                    <p className="text-gray-500 text-sm">Start by locking some funds</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Add Token Modal */}
      <AddTokenModal isOpen={showAddToken} onClose={() => setShowAddToken(false)} chainId={chainId} />

      {/* Copy Notification */}
      {copied && (
        <motion.div
          className="fixed top-4 right-4 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="glass-card bg-green-500/20 border-green-500/30 backdrop-blur-md">
            <CardContent className="p-3 flex items-center space-x-2">
              <Copy className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">Address copied!</span>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
