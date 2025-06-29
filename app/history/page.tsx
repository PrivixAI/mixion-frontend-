"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Activity, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWallet } from "@/hooks/useWallet"
import { getTransactionHistory } from "@/lib/storage"
import { TransactionRow } from "@/components/TransactionRow"
import config from "@/config.json"

export default function HistoryPage() {
  const router = useRouter()
  const { account, chainId } = useWallet()
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterChain, setFilterChain] = useState("all")
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    if (!account || !chainId) {
      router.push("/connect-wallet")
      return
    }

    // Load transaction history
    const history = getTransactionHistory()
    setTransactions(history)
    setFilteredTransactions(history)
  }, [account, chainId, router])

  useEffect(() => {
    // Apply filters
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.currency.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterChain !== "all") {
      filtered = filtered.filter((tx) => tx.chainId === Number.parseInt(filterChain))
    }

    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.type === filterType)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, filterChain, filterType])

  if (!account || !chainId) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <motion.div
          className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 150, 0],
            y: [0, -75, 0],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
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
          <div className="max-w-6xl mx-auto flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Transaction History</h1>
              <p className="text-gray-400">View all your lock and unlock transactions</p>
            </div>
          </div>
        </motion.header>

        <div className="max-w-6xl mx-auto p-6">
          {/* Filters */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search by hash or token..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass-input bg-white/5 border-white/10 text-white placeholder-gray-400 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Chain</label>
                    <Select value={filterChain} onValueChange={setFilterChain}>
                      <SelectTrigger className="glass-input bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">All Chains</SelectItem>
                        {config.chains.map((chain) => (
                          <SelectItem key={chain.chainId} value={chain.chainId.toString()}>
                            {chain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Type</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="glass-input bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="lock">Lock</SelectItem>
                        <SelectItem value="unlock">Unlock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchTerm("")
                        setFilterChain("all")
                        setFilterType("all")
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Transaction List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Transactions ({filteredTransactions.length})</span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                {filteredTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction, index) => (
                      <motion.div
                        key={`${transaction.txHash}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <TransactionRow transaction={transaction} showChain />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No transactions found</h3>
                    <p className="text-gray-400 mb-6">
                      {transactions.length === 0
                        ? "You haven't made any transactions yet"
                        : "Try adjusting your filters"}
                    </p>
                    {transactions.length === 0 && (
                      <Button
                        onClick={() => router.push("/lock-funds")}
                        className="glass-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                      >
                        Lock Your First Funds
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
