"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import GameViewer from "../../components/GameViewer";
import { Button } from "@/components/ui/button";
import {
  Timer,
  FileText,
  BarChartIcon as ChartBar,
  Trophy,
  Zap,
  Brain,
  PuzzleIcon,
  Text,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { BookOpen, Target } from "lucide-react";

const games = [
  {
    title: "Marketing Quick Race",
    description:
      "Race against an AI opponent in this fast-paced marketing quiz! Choose your difficulty level, answer questions quickly, and use strategic power-ups to win. Perfect for DECA competition preparation with adaptive difficulty and comprehensive post-game analysis.",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Marketing-race.png-iQ1jCLbSeKh9GkJ4EwOoOcWgWFNPDu.webp",
    icon: Timer,
    color: "#6366F1",
    tags: ["AI-Adaptive", "Real-time Competition", "Power-ups"],
    url: "https://ugr2ld7alqcgnjtd.vercel.app/",
    features: [
      {
        icon: Trophy,
        title: "Multiple Difficulty Levels",
        description:
          "Choose between MCEC (Easy), State Competition (Medium), or International Competition (Hard)",
      },
      {
        icon: Timer,
        title: "Competitive Racing",
        description:
          "Race against an AI opponent with adaptive difficulty and real-time progress tracking",
      },
      {
        icon: Zap,
        title: "Strategic Power-ups",
        description:
          "Use Time Freeze, Double Score, and Skip Question to gain advantages",
      },
    ],
    gameDetails: {
      questionPools: "100+ Marketing Questions",
      modes: ["10 Questions", "25 Questions", "50 Questions"],
      features: [
        "Real-time Competition",
        "Progress Tracking",
        "Power-up System",
        "Post-game Analysis",
        "Answer Explanations",
        "Performance Stats",
      ],
    },
  },
  {
    title: "Buzzword Blitz",
    description:
      "Master industry-specific terminology through an engaging word game that challenges players to unscramble and identify business-related terms across various career clusters. Perfect for career preparation and professional development.",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BuzzwordBlitz-OdgxuvwLwhdTmKtLK0NpCnNyjDiUxH.png",
    icon: Text,
    color: "#10B981",
    tags: ["5 Career Clusters", "Multiple Modes", "Adaptive Learning"],
    url: "https://ray6te07yxqpxypi.vercel.app/",
    features: [
      {
        icon: BookOpen,
        title: "Comprehensive Career Coverage",
        description:
          "Five career clusters including Business, Marketing, Entrepreneurship, Hospitality & Tourism, and Finance",
      },
      {
        icon: Layers,
        title: "Multiple Learning Modes",
        description:
          "Study with flashcards, train at your own pace, or challenge yourself in timed mode",
      },
      {
        icon: Target,
        title: "Adaptive Difficulty",
        description:
          "Choose between Easy mode with hints and definitions or Hard mode for an extra challenge",
      },
    ],
    gameDetails: {
      questionPools: "500+ Industry Terms",
      modes: ["Study Mode", "Training Mode", "Timed Mode"],
      features: [
        "5 Career Clusters",
        "Performance Tracking",
        "Hint System",
        "Streak Bonuses",
        "Progress Analytics",
        "Accessibility Features",
      ],
    },
  },
  {
    title: "Puzzle Quest",
    description:
      "Embark on a journey through multiple puzzle types while learning financial literacy! Connect cables, find paths, and solve parking challenges, each followed by educational questions. Perfect for developing problem-solving skills and financial knowledge.",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Puzzle%20Quest-3Fw56MO6f7YYX96xV530LY9GJueo59.png",
    icon: PuzzleIcon,
    color: "#22D3EE",
    tags: ["Multi-level", "Problem Solving", "Financial Literacy"],
    url: "#",
    features: [
      {
        icon: Brain,
        title: "Diverse Puzzle Types",
        description:
          "Experience cable connection, path finding, and parking challenges across multiple levels",
      },
      {
        icon: Trophy,
        title: "Educational Integration",
        description:
          "Learn financial literacy concepts through interactive puzzles and questions",
      },
      {
        icon: ChartBar,
        title: "Progress Tracking",
        description:
          "Monitor your advancement with detailed statistics and performance metrics",
      },
    ],
    gameDetails: {
      questionPools: "50+ Financial Literacy Questions",
      modes: ["Cable Connection", "Path Finding", "Parking Challenge"],
      features: [
        "Multiple Puzzle Types",
        "Progressive Difficulty",
        "Educational Questions",
        "Performance Tracking",
        "Level-based Progress",
        "Adaptive Learning",
      ],
    },
  },
];

export default function MiniGamesPage() {
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A16]">
      <Header />

      <main className="pt-24 pb-32">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold text-center mb-12 bg-gradient-to-r from-[#6366F1] via-[#22D3EE] to-[#FF3B9A] text-transparent bg-clip-text"
          >
            Try Our Mini-Games
          </motion.h1>

          {selectedGame !== null ? (
            <>
              <Button
                onClick={() => setSelectedGame(null)}
                variant="ghost"
                className="mb-8"
              >
                ← Back to All Games
              </Button>
              <GameViewer
                gameUrl={games[selectedGame].url}
                title={games[selectedGame].title}
                description={games[selectedGame].description}
                features={games[selectedGame].features}
                gameDetails={games[selectedGame].gameDetails}
              />
            </>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {games.map((game, index) => {
                const Icon = game.icon;
                return (
                  <motion.div
                    key={game.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group relative bg-white/5 rounded-xl overflow-hidden backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <div className="aspect-[3/2] relative overflow-hidden">
                      <Image
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A16] via-transparent to-transparent opacity-60" />
                    </div>

                    <div className="absolute top-4 left-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${game.color}20` }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: game.color }}
                        />
                      </div>
                    </div>

                    <div className="relative p-6">
                      <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#22D3EE] transition-colors">
                        {game.title}
                      </h3>
                      <p className="text-gray-400 mb-4">{game.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {game.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 text-xs rounded-full bg-white/10 text-white/80 font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:opacity-90"
                        onClick={() => setSelectedGame(index)}
                        disabled={game.url === "#"}
                      >
                        {game.url === "#" ? "Coming Soon" : "Play Now"}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
