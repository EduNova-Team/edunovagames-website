"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Maximize2, Trophy, Clock, Users, Star, Timer, Zap, Brain, ArrowRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface GameFeature {
  icon: any
  title: string
  description: string
}

interface GameDetails {
  questionPools: string
  modes: string[]
  features: string[]
}

interface GameViewerProps {
  gameUrl: string
  title: string
  description: string
  features?: GameFeature[]
  gameDetails?: GameDetails
}

export default function GameViewer({ gameUrl, title, description, features, gameDetails }: GameViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = async () => {
    try {
      const gameContainer = document.getElementById("game-container")
      if (!gameContainer) return

      if (!document.fullscreenElement) {
        await gameContainer.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error("Error attempting to toggle fullscreen:", err)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-8">
      <div className="space-y-6">
        <div
          id="game-container"
          className="relative bg-white rounded-xl overflow-hidden w-full min-h-[1080px] h-[80vh]"
        >
          <iframe src={gameUrl} className="absolute inset-0 w-full h-full scale-[99%]" allow="fullscreen" />
          <Button
            onClick={toggleFullscreen}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
            <p className="text-gray-400">{description}</p>
          </div>

          {features && (
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="bg-white/5 rounded-xl p-4 space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-[#6366F1]/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#6366F1]" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          )}

          {gameDetails && (
            <div className="bg-white/5 rounded-xl p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Game Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Question Pool</div>
                    <div className="font-medium">{gameDetails.questionPools}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Game Modes</div>
                    <div className="flex flex-wrap gap-2">
                      {gameDetails.modes.map((mode, index) => (
                        <span key={index} className="px-3 py-1 text-xs rounded-full bg-white/10 text-white/80">
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {gameDetails.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Game Stats */}
        <div className="bg-white/5 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-lg">Game Stats</h3>
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-[#6366F1]" />
              </div>
              <div>
                <div className="text-sm text-gray-400">High Score</div>
                <div className="font-semibold">2,450 pts</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#22D3EE]" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Players</div>
                <div className="font-semibold">80</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF3B9A]/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#FF3B9A]" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Avg. Completion</div>
                <div className="font-semibold">4m 30s</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white/5 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-lg">Player Reviews</h3>
          <div className="space-y-4">
            {[
              {
                name: "Tyler B.",
                rating: 5,
                comment: "Great way to practice marketing concepts! The time pressure makes it exciting.",
              },
              {
                name: "Nathan",
                rating: 4,
                comment: "Really helpful for competition prep. Would love more questions!",
              },
            ].map((review, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.name}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#22D3EE] text-[#22D3EE]" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-400">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Games */}
        <div className="bg-white/5 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-lg">You Might Also Like</h3>
          <div className="grid gap-4">
            {[
              {
                title: "Puzzle Quest",
                players: "62 playing",
                image:
                  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Puzzle%20Quest-ll0CP60JHPmrN14FFNzfP6xYMYBspD.png",
              },
              {
                title: "Buzzword Blitz",
                players: "54 playing",
                image:
                  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BuzzwordBlitz-BsLSJYdNYJ6HfqMIyId1G8BDgkCeC4.png",
              },
            ].map((game, index) => (
              <div key={index} className="flex gap-3 group cursor-pointer">
                <div className="relative w-20 h-12 rounded-lg overflow-hidden">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div>
                  <div className="font-medium group-hover:text-[#22D3EE] transition-colors">{game.title}</div>
                  <div className="text-xs text-gray-400">{game.players}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

