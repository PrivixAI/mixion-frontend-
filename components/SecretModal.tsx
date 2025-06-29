"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Download, Eye, EyeOff, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SecretModalProps {
  isOpen: boolean
  onClose: () => void
  secret: string
}

export function SecretModal({ isOpen, onClose, secret }: SecretModalProps) {
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([secret], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mixion-secret-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
              <CardHeader className="text-center">
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <CardTitle className="text-white">Funds Locked Successfully!</CardTitle>
                <p className="text-gray-300 text-sm">Save your secret to unlock your funds later</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <Alert className="bg-yellow-500/10 border-yellow-500/20">
                  <AlertDescription className="text-yellow-300">
                    <strong>Important:</strong> Keep this secret safe! You'll need it to unlock your funds. If you lose
                    it, your funds will be permanently locked.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Your Secret</label>
                  <div className="relative">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 font-mono text-white break-all">
                      {showSecret ? secret : "•".repeat(secret.slice(0, 20).length)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="glass-button bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>

                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="glass-button bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <Button
                  onClick={onClose}
                  className="w-full glass-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  Continue to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
