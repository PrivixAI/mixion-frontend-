"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWallet } from "@/hooks/useWallet"
import { useBalances } from "@/hooks/useBalances"
import {
  getChainConfig,
  formatBalance,
  parseBalance,
  lockNativeFunds,
  lockERC20Funds,
  approveERC20,
  checkERC20Allowance,
  generateSecret,
  computeCommitment,
} from "@/lib/blockchain"
import { saveTransaction, getCustomTokens } from "@/lib/storage"
import { TokenSelector } from "@/components/TokenSelector"
import { LoadingModal } from "@/components/LoadingModal"
import { SecretModal } from "@/components/SecretModal"

export default function LockFundsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { account, chainId } = useWallet()
  const { balances, nativeBalance } = useBalances()

  const [selectedToken, setSelectedToken] = useState(null)
  const [amount, setAmount] = useState("")
  const [useCustomSecret, setUseCustomSecret] = useState(false)
  const [customSecret, setCustomSecret] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [error, setError] = useState("")
  const [needsApproval, setNeedsApproval] = useState(false)
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [generatedSecret, setGeneratedSecret] = useState("")

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

    // Pre-select token from URL params, but allow changing
    const tokenParam = searchParams.get("token")
    if (tokenParam && chainConfig && !selectedToken) {
      const allTokens = [...chainConfig.tokens, ...getCustomTokens(chainId)]
      const token = allTokens.find((t) => t.symbol === tokenParam)
      if (token) {
        setSelectedToken(token)
      } else {
        setSelectedToken(chainConfig.tokens[0]) // Default to native token
      }
    } else if (chainConfig && !selectedToken) {
      setSelectedToken(chainConfig.tokens[0]) // Default to native token
    }
  }, [account, chainId, chainConfig, router, searchParams, selectedToken])

  useEffect(() => {
    checkApprovalNeeded()
  }, [selectedToken, amount])

  const checkApprovalNeeded = async () => {
    if (!selectedToken || !amount || selectedToken.address === "0x0000000000000000000000000000000000000000") {
      setNeedsApproval(false)
      return
    }

    try {
      const amountWei = parseBalance(amount, selectedToken.decimals)
      const allowance = await checkERC20Allowance(selectedToken.address, account, chainConfig.contractAddress)
      setNeedsApproval(allowance.lt(amountWei))
    } catch (err) {
      console.error("Error checking allowance:", err)
    }
  }

  const handleApprove = async () => {
    if (!selectedToken || !amount) return

    setIsLoading(true)
    setLoadingMessage("Approving token transfer...")
    setError("")

    try {
      const amountWei = parseBalance(amount, selectedToken.decimals)
      await approveERC20(selectedToken.address, chainConfig.contractAddress, amountWei)
      setNeedsApproval(false)
    } catch (err) {
      setError(err.message || "Failed to approve token")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLock = async () => {
    if (!selectedToken || !amount) return

    setIsLoading(true)
    setLoadingMessage("Locking funds...")
    setError("")

    try {
      // Generate or use custom secret
      const secret = useCustomSecret ? customSecret : generateSecret()
      const commitment = computeCommitment(secret)

      let txHash
      const amountWei = parseBalance(amount, selectedToken.decimals)

      if (selectedToken.address === "0x0000000000000000000000000000000000000000") {
        // Lock native token
        txHash = await lockNativeFunds(commitment, amountWei)
      } else {
        // Lock ERC20 token
        txHash = await lockERC20Funds(commitment, selectedToken.address, amountWei)
      }

      // Save transaction to history
      saveTransaction({
        txHash,
        type: "lock",
        amount,
        currency: selectedToken.symbol,
        chainId,
        timestamp: Date.now(),
        secret, // Store secret for user reference
      })

      setGeneratedSecret(secret)
      setShowSecretModal(true)
    } catch (err) {
      setError(err.message || "Failed to lock funds")
    } finally {
      setIsLoading(false)
    }
  }

  const validateAmount = () => {
    if (!amount || !selectedToken) return false

    const amountNum = Number.parseFloat(amount)
    if (amountNum <= 0) return false

    const balance =
      selectedToken.address === "0x0000000000000000000000000000000000000000"
        ? nativeBalance
        : balances[selectedToken.address] || "0"

    return Number.parseFloat(formatBalance(balance)) >= amountNum
  }

  const isFormValid = () => {
    return validateAmount() && (!useCustomSecret || customSecret.length >= 8) && !needsApproval
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <motion.div
          className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
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
          <div className="max-w-2xl mx-auto flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Lock Funds</h1>
              <p className="text-gray-400">Securely lock your assets with privacy</p>
            </div>
          </div>
        </motion.header>

        <div className="max-w-2xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Lock Funds</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Token Selector */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Select Token</Label>
                  <TokenSelector
                    selectedToken={selectedToken}
                    onTokenSelect={setSelectedToken}
                    chainConfig={chainConfig}
                    balances={balances}
                    nativeBalance={nativeBalance}
                    disabled={false} // Always allow token selection
                  />
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Amount</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="glass-input bg-white/5 border-white/10 text-white placeholder-gray-400 pr-20"
                      step="any"
                      min="0"
                    />
                    {selectedToken && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-gray-400 text-sm">{selectedToken.symbol}</span>
                      </div>
                    )}
                  </div>
                  {selectedToken && (
                    <p className="text-gray-400 text-sm">
                      Balance:{" "}
                      {formatBalance(
                        selectedToken.address === "0x0000000000000000000000000000000000000000"
                          ? nativeBalance
                          : balances[selectedToken.address] || "0",
                      )}{" "}
                      {selectedToken.symbol}
                    </p>
                  )}
                </div>

                {/* Secret Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Use Custom Secret</Label>
                    <Switch checked={useCustomSecret} onCheckedChange={setUseCustomSecret} />
                  </div>

                  {useCustomSecret && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2"
                    >
                      <Label className="text-gray-300">Secret (min 8 characters)</Label>
                      <div className="relative">
                        <Input
                          type={showSecret ? "text" : "password"}
                          placeholder="Enter your secret"
                          value={customSecret}
                          onChange={(e) => setCustomSecret(e.target.value)}
                          className="glass-input bg-white/5 border-white/10 text-white placeholder-gray-400 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Keep this secret safe! You'll need it to unlock your funds.
                      </p>
                    </motion.div>
                  )}

                  {!useCustomSecret && (
                    <p className="text-gray-400 text-sm">A random secret will be generated for you</p>
                  )}
                </div>

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

                {/* Action Buttons */}
                <div className="space-y-3">
                  {needsApproval && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Button
                        onClick={handleApprove}
                        disabled={isLoading || !validateAmount()}
                        className="w-full glass-button bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                      >
                        Approve {selectedToken?.symbol}
                      </Button>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleLock}
                      disabled={isLoading || !isFormValid()}
                      className="w-full glass-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-6 text-lg"
                    >
                      <Lock className="w-5 h-5 mr-2" />
                      Lock Funds
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Loading Modal */}
      <LoadingModal isOpen={isLoading} message={loadingMessage} />

      {/* Secret Display Modal */}
      <SecretModal
        isOpen={showSecretModal}
        onClose={() => {
          setShowSecretModal(false)
          router.push("/dashboard")
        }}
        secret={generatedSecret}
      />
    </div>
  )
}
