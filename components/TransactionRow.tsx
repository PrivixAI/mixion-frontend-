"use client"

import { motion } from "framer-motion"
import { ExternalLink, Lock, Unlock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatAddress, getChainConfig } from "@/lib/blockchain"

interface TransactionRowProps {
  transaction: any
  showChain?: boolean
}

export function TransactionRow({ transaction, showChain = false }: TransactionRowProps) {
  const chainConfig = getChainConfig(transaction.chainId)
  const isLock = transaction.type === "lock"

  const handleViewTransaction = () => {
    if (chainConfig) {
      const url = `${chainConfig.blockExplorerUrl}tx/${transaction.txHash}`
      window.open(url, "_blank")
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <motion.div
      className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center space-x-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isLock ? "bg-gradient-to-br from-blue-400 to-blue-600" : "bg-gradient-to-br from-green-400 to-green-600"
          }`}
        >
          {isLock ? <Lock className="w-5 h-5 text-white" /> : <Unlock className="w-5 h-5 text-white" />}
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="secondary"
              className={`${
                isLock
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  : "bg-green-500/20 text-green-300 border-green-500/30"
              }`}
            >
              {isLock ? "Lock" : "Unlock"}
            </Badge>
            {showChain && chainConfig && (
              <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20">
                {chainConfig.name}
              </Badge>
            )}
          </div>

          <p className="text-white font-medium">
            {transaction.amount} {transaction.currency}
          </p>

          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>{formatDate(transaction.timestamp)}</span>
            <span className="font-mono">{formatAddress(transaction.txHash)}</span>
          </div>
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={handleViewTransaction} className="text-gray-400 hover:text-white">
        <ExternalLink className="w-4 h-4" />
      </Button>
    </motion.div>
  )
}
