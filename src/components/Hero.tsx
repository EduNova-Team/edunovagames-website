"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Brain, Cpu, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#080808_1px,transparent_1px),linear-gradient(to_bottom,#080808_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#6366F1]/20 via-[#22D3EE]/20 to-transparent opacity-60" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5 mb-6"
          >
            <span className="text-sm font-mono text-[#22D3EE]">Pioneering AI-Enhanced Educational Gaming</span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-space font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Where <span className="text-[#6366F1]">AI</span>, <span className="text-[#22D3EE]">Gaming</span>, and{" "}
            <span className="text-[#FF3B9A]">Learning</span> Converge
          </motion.h1>

          <motion.p
            className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Experience our cutting-edge mini-games powered by AI. Enhance your skills, track your progress, and
            revolutionize your learning journey.
          </motion.p>

          <motion.div
            className="grid md:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-[#6366F1]/20 flex items-center justify-center mb-3 mx-auto">
                <Brain className="w-5 h-5 text-[#6366F1]" />
              </div>
              <h3 className="text-base font-semibold mb-2">AI-Powered Learning</h3>
              <p className="text-gray-400 text-sm">Adaptive learning paths enhanced by advanced AI algorithms</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-[#22D3EE]/20 flex items-center justify-center mb-3 mx-auto">
                <Cpu className="w-5 h-5 text-[#22D3EE]" />
              </div>
              <h3 className="text-base font-semibold mb-2">Interactive Gaming</h3>
              <p className="text-gray-400 text-sm">Engaging educational games designed for optimal learning</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-[#FF3B9A]/20 flex items-center justify-center mb-3 mx-auto">
                <BarChart3 className="w-5 h-5 text-[#FF3B9A]" />
              </div>
              <h3 className="text-base font-semibold mb-2">Progress Tracking</h3>
              <p className="text-gray-400 text-sm">Comprehensive analytics and performance monitoring</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/mini-games">
              <Button className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#6366F1]/90 text-white px-8 h-12 text-lg rounded-full">
                Try Mini-Games
              </Button>
            </Link>
            <Link href="/#contact" scroll={false}>
              <Button
                className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#6366F1]/90 text-white px-8 h-12 text-lg rounded-full"
                onClick={() => {
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Get Started
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-[#22D3EE] text-[#22D3EE] hover:bg-[#22D3EE]/10 px-8 h-12 text-lg rounded-full"
              onClick={() => document.getElementById("research")?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn More
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
