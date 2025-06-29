"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Unlock, Eye, EyeOff, AlertCircle, CheckCircle, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWallet } from "@/hooks/useWallet"
import {
  getChainConfig,
  formatBalance,
  unlockFunds,
  getLockedDetails,
  isNullifierUsed,
  computeCommitment,
  computeNullifier,
} from "@/lib/blockchain"
import { saveTransaction } from "@/lib/storage"
import { LoadingModal } from "@/components/LoadingModal"

// Define TypeScript interface for fundDetails (optional, for type safety)
interface FundDetails {
  amount: string;
  fee: string;
  netAmount: string;
  token: {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
  };
  commitment: string;
  nullifier: string;
}

export default function UnlockFundsPage() {
  const router = useRouter()
  const { account, chainId } = useWallet()

  const [secret, setSecret] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [error, setError] = useState("")
  const [fundDetails, setFundDetails] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [nullifierUsed, setNullifierUsed] = useState(false)

  const chainConfig = chainId ? getChainConfig(chainId) : null

  useEffect(() => {
    if (!account || !chainId || !chainConfig) {
      router.push("/connect-wallet")
      return
    }
  }, [account, chainId, chainConfig, router])

  useEffect(() => {
    if (secret.length >= 8) {
      validateSecret()
    } else {
      setFundDetails(null)
      setNullifierUsed(false)
      setError("")
    }
  }, [secret])

 const validateSecret = async () => {
    if (!secret || secret.length < 8) return

    setIsValidating(true)
    setError("")
    setFundDetails(null)

    try {
      const nullifier = computeNullifier(secret)
      const commitment = computeCommitment(secret)

      // Check if nullifier is already used
      const used = await isNullifierUsed(nullifier)
      if (used) {
        setNullifierUsed(true)
        setError("Funds already withdrawn")
        return
      }

      // Get locked details
      const details = await getLockedDetails(commitment)

      if (details.amount === "0") {
        setError("No funds found for this secret")
        return
      }

      // Find token info
      let tokenInfo = chainConfig.tokens.find((t) => t.address.toLowerCase() === details.tokenAddress.toLowerCase())

      if (!tokenInfo) {
        // If token not found in config, it might be a custom token
        tokenInfo = {
          name: "Unknown Token",
          symbol: "UNK",
          address: details.tokenAddress,
          decimals: 18,
        }
      }

      setFundDetails({
        amount: formatBalance(details.amount, tokenInfo.decimals),
        fee: formatBalance(details.fee, tokenInfo.decimals),
        netAmount: formatBalance(details.netAmount, tokenInfo.decimals),
        token: tokenInfo,
        commitment,
        nullifier,
      })
      setNullifierUsed(false)
    } catch (err) {
      console.error("Error validating secret:", err)
      setError("Failed to validate secret")
    } finally {
      setIsValidating(false)
    }
  }


  const handleUnlock = async () => {
    if (!fundDetails) return

    setIsLoading(true)
    setLoadingMessage("Unlocking funds...")
    setError("")

    try {
      const txHash = await unlockFunds(fundDetails.nullifier)

      // Save transaction to history
      saveTransaction({
        txHash,
        type: "unlock",
        amount: fundDetails.netAmount, // Use netAmount for transaction history
        currency: fundDetails.token.symbol,
        chainId,
        timestamp: Date.now(),
      })

      // Redirect to dashboard with success message
      router.push("/dashboard?unlocked=true")
    } catch (err) {
      setError(err.message || "Failed to unlock funds")
    } finally {
      setIsLoading(false)
    }
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
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 18,
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
              <h1 className="text-2xl font-bold text-white">Unlock Funds</h1>
              <p className="text-gray-400">Retrieve your locked assets</p>
            </div>
          </div>
        </motion.header>

        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Secret Input Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Unlock className="w-5 h-5" />
                  <span>Enter Your Secret</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Secret</Label>
                  <div className="relative">
                    <Input
                      type={showSecret ? "text" : "password"}
                      placeholder="Enter the secret used to lock funds"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
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
                  {isValidating && (
                    <div className="flex items-center space-x-2 text-blue-400 text-sm">
                      <motion.div
                        className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                      <span>Validating secret...</span>
                    </div>
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

                {/* Nullifier Used Alert */}
                {nullifierUsed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert className="bg-yellow-500/10 border-yellow-500/20">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      <AlertDescription className="text-yellow-300">
                        These funds have already been withdrawn
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Fund Details Card */}
          {fundDetails && !nullifierUsed && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Coins className="w-5 h-5" />
                    <span>Locked Funds Found</span>
                  </CardTitle>
                </CardHeader>

               <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{fundDetails.token.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-lg">
                          {fundDetails.amount} {fundDetails.token.symbol}
                        </p>
                        <p className="text-gray-400 text-sm">{fundDetails.token.name}</p>
                        <p className="text-gray-300 text-sm">
                          Fee (2%): {fundDetails.fee} {fundDetails.token.symbol}
                        </p>
                        <p className="text-green-300 text-sm">
                          You will receive: {fundDetails.netAmount} {fundDetails.token.symbol}
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleUnlock}
                      disabled={isLoading}
                      className="w-full glass-button bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg"
                    >
                      <Unlock className="w-5 h-5 mr-2" />
                      Unlock Funds
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Loading Modal */}
      <LoadingModal isOpen={isLoading} message={loadingMessage} />
    </div>
  )
}
