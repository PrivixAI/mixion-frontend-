"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, Lock, Globe, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import TrueFocus from "@/components/ui/TrueFocus"
import LetterGlitch from "@/components/ui/LetterGlitch"
import DecryptedText from "@/components/decrypt"
import FuzzyText from "@/components/ui/fuZZTtxt"

export default function LandingPage() {
  const router = useRouter()
  const [isFirstVisit, setIsFirstVisit] = useState(true)

  useEffect(() => {
    const hasVisited = localStorage.getItem("mixion-visited")
    if (hasVisited) {
      setIsFirstVisit(false)
    } else {
      localStorage.setItem("mixion-visited", "true")
    }
  }, [])

  const handleGetStarted = () => {
    router.push("/connect-wallet")
  }

  const features = [
    {
      icon: Globe,
      title: "Multichain Support",
      description: "Lock and unlock funds across multiple EVM-compatible blockchains seamlessly",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Anonymous transactions using commitment-nullifier cryptographic proofs",
    },
    {
      icon: Lock,
      title: "Secure Locking",
      description: "Lock native coins and ERC20 tokens with military-grade security",
    },
    {
      icon: Sparkles,
      title: "Modern Interface",
      description: "Beautiful glassmorphism design with intuitive user experience",
    },
  ]

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
          className="relative z-10 p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <nav className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">MixionLocker</span>
            </div>
            {/* <Button
              onClick={handleGetStarted}
              className="glass-button bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button> */}
            <Button
  onClick={handleGetStarted}
  className="bg-[#001f3f] hover:bg-[#003366] text-white border border-white/10 shadow-md"
>
  Get Started
  <ArrowRight className="w-4 h-4 ml-2" />
</Button>

          </nav>
        </motion.header>

        {/* Hero Section */}
        <motion.section
          className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="mb-6 text-white"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
<TrueFocus
  sentence="Secure Your Funds with Privacy"
  wordColors={{
    Privacy: "#005eff", // Blue
    Funds: "#00ffaa",   // Light green
  }}
  borderColor="rgb(0,94,255)"
  glowColor="hsla(231, 95.90%, 47.30%, 0.60)"
  animationDuration={0.8}
  pauseBetweenAnimations={2}
  blurAmount={3}
/>

          </motion.div>

{/* <motion.p
  className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto text-center"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.8, delay: 0.6 }}
>


    Lock and unlock assets anonymously across multiple chains using advanced cryptographic commitments
</motion.p> */}

<motion.p
  className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto text-center transition duration-300 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
  initial={{ opacity: 0, y: 20, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{
    duration: 0.8,
    delay: 0.6,
    ease: [0.25, 0.8, 0.25, 1],
  }}
>
  Lock and unlock assets anonymously across multiple chains using advanced cryptographic commitments
</motion.p>




          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="glass-button bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-12 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
            >
              Get Started
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          className="relative z-10 px-6 py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="max-w-7xl mx-auto">

{/* <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
  Why Choose <DecryptedText text="MixionLocker" animateOn="hover" revealDirection="center" />?
</h2> */}
<h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
  Why Choose <DecryptedText 
    text="MixionLocker" 
    animateOn="hover" 
    revealDirection="center" 
    className="text-blue-500" 
    encryptedClassName="text-green-500"
  />?
</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                >
                  <Card className="glass-card bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-[#005eff] rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          className="relative z-10 p-6 text-center text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <div className="max-w-7xl mx-auto border-t border-white/10 pt-8">
            <p className="mb-4">Built with privacy and security in mind</p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="hover:text-blue-400 transition-colors">
                Documentation
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                Support
              </a>
            </div>
            <p className="mt-4 text-sm">Powered by Privix labs</p>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}
