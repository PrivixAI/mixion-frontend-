import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/hooks/useWallet"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MixionLocker - Secure Privacy-Focused Asset Locking",
  description: "Lock and unlock assets anonymously across multiple chains using advanced cryptographic commitments",
  keywords: "DeFi, Privacy, Blockchain, Asset Locking, Multichain, Ethereum,BNB,PRIVIX",
  authors: [{ name: "PRIVIX Labs" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#1E3A8A"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}
