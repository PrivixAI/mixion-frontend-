"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatBalance } from "@/lib/blockchain"
import { getCustomTokens } from "@/lib/storage"

interface TokenSelectorProps {
  selectedToken: any
  onTokenSelect: (token: any) => void
  chainConfig: any
  balances: Record<string, string>
  nativeBalance: string
  disabled?: boolean
}

export function TokenSelector({
  selectedToken,
  onTokenSelect,
  chainConfig,
  balances,
  nativeBalance,
  disabled = false,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Combine default tokens with custom tokens
  const customTokens = getCustomTokens(chainConfig.chainId)
  const allTokens = [...chainConfig.tokens, ...customTokens]

  const getTokenBalance = (token: any) => {
    if (token.address === "0x0000000000000000000000000000000000000000") {
      return nativeBalance
    }
    return balances[token.address] || "0"
  }

  const handleCardClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleTokenClick = (token: any, event: React.MouseEvent) => {
    event.stopPropagation()
    onTokenSelect(token)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.div whileHover={!disabled ? { scale: 1.01 } : {}} whileTap={!disabled ? { scale: 0.99 } : {}}>
        <Card
          className={`glass-card bg-white/10 border-white/20 backdrop-blur-md transition-all duration-200 ${
            !disabled ? "cursor-pointer hover:bg-white/15" : "cursor-not-allowed opacity-75"
          }`}
          onClick={handleCardClick}
        >
          <CardContent className="p-4 flex items-center justify-between">
            {selectedToken ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{selectedToken.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{selectedToken.symbol}</p>
                  <p className="text-gray-300 text-sm">Balance: {formatBalance(getTokenBalance(selectedToken))}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <p className="text-gray-400">Select a token</p>
              </div>
            )}

            {!disabled && (
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            className="absolute top-full left-0 right-0 z-50 mt-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-slate-800/95 border-slate-600/50 backdrop-blur-xl shadow-2xl max-h-64 overflow-y-auto">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {allTokens.map((token) => (
                    <motion.div key={token.address} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <div
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/80 cursor-pointer transition-all duration-200 border border-transparent hover:border-slate-600/30"
                        onClick={(e) => handleTokenClick(token, e)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xs">{token.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{token.symbol}</p>
                            <p className="text-gray-300 text-xs">{token.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm font-medium">{formatBalance(getTokenBalance(token))}</p>
                          <p className="text-gray-400 text-xs">{token.symbol}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
