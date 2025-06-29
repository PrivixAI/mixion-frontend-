"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchTokenDetails } from "@/lib/blockchain"
import { saveCustomToken } from "@/lib/storage"

interface AddTokenModalProps {
  isOpen: boolean
  onClose: () => void
  chainId: number
}

export function AddTokenModal({ isOpen, onClose, chainId }: AddTokenModalProps) {
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenDetails, setTokenDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleFetchDetails = async () => {
    if (!tokenAddress || tokenAddress.length !== 42) {
      setError("Please enter a valid contract address")
      return
    }

    setIsLoading(true)
    setError("")
    setTokenDetails(null)

    try {
      const details = await fetchTokenDetails(tokenAddress)
      setTokenDetails(details)
    } catch (err) {
      setError(err.message || "Failed to fetch token details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveToken = () => {
    if (!tokenDetails) return

    try {
      saveCustomToken(chainId, {
        name: tokenDetails.name,
        symbol: tokenDetails.symbol,
        address: tokenAddress,
        decimals: tokenDetails.decimals,
        logoUri: "", // Could be enhanced to fetch logo
      })

      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err) {
      setError("Failed to save token")
    }
  }

  const handleClose = () => {
    setTokenAddress("")
    setTokenDetails(null)
    setError("")
    setSuccess(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card bg-white/10 border-white/20 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Add Custom Token</span>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-6">
                {!success ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Token Contract Address</Label>
                      <Input
                        placeholder="0x..."
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        className="glass-input bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />
                    </div>

                    {error && (
                      <Alert className="bg-red-500/10 border-red-500/20">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300">{error}</AlertDescription>
                      </Alert>
                    )}

                    {tokenDetails && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="bg-green-500/10 border-green-500/20">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">{tokenDetails.symbol.slice(0, 2)}</span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{tokenDetails.symbol}</p>
                                <p className="text-gray-300 text-sm">{tokenDetails.name}</p>
                                <p className="text-gray-400 text-xs">Decimals: {tokenDetails.decimals}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    <div className="flex space-x-3">
                      {!tokenDetails ? (
                        <Button
                          onClick={handleFetchDetails}
                          disabled={isLoading || !tokenAddress}
                          className="flex-1 glass-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                        >
                          {isLoading ? (
                            <motion.div
                              className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            />
                          ) : (
                            "Fetch Details"
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSaveToken}
                          className="flex-1 glass-button bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                        >
                          Save Token
                        </Button>
                      )}

                      <Button variant="ghost" onClick={handleClose} className="text-gray-400 hover:text-white">
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Token Added Successfully!</h3>
                    <p className="text-gray-300">{tokenDetails?.symbol} has been added to your token list</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
