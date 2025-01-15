"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Users,
  BarChartIcon as ChartBar,
  Shield,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const solutions = [
  {
    title: "K-12 Education",
    description:
      "Gamified learning solutions aligned with curriculum standards, perfect for elementary through high school education.",
    icon: GraduationCap,
    color: "#6366F1",
    features: [
      "Curriculum-aligned content",
      "Safe learning environment",
      "Parent dashboard",
    ],
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/K-12.jpg-sDW0ciDErTrW92AvvWDnROvGeoDMrv.jpeg",
  },
  {
    title: "Higher Education",
    description:
      "Advanced learning platforms for colleges and universities, supporting diverse academic disciplines.",
    icon: Users,
    color: "#22D3EE",
    features: [
      "Research integration",
      "Custom course creation",
      "Analytics dashboard",
    ],
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Higher%20Education.jpg-yL8vs51vChl3LoW007MW2AzBpCU4XU.jpeg",
  },
  {
    title: "Corporate Training",
    description:
      "Professional development and skill-building programs for businesses and organizations.",
    icon: ChartBar,
    color: "#FF3B9A",
    features: ["Skill assessments", "Progress tracking", "Certification paths"],
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Corporate%20Training.jpg-4IUivtB3sI7MKksxwXPUxcDNfGoVdI.jpeg",
  },
  {
    title: "Educational Research",
    description:
      "Tools and platforms for researchers studying learning patterns and educational outcomes.",
    icon: Shield,
    color: "#10B981",
    features: ["Data collection", "Analysis tools", "Research collaboration"],
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Educational%20Research.jpg-y66iksiTquL3zg4dqbs8gmYvwA5d1W.jpeg",
  },
];

export default function Solutions() {
  const [activeSolution, setActiveSolution] = useState(0);

  return (
    <section id="solutions" className="py-32 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-space font-bold mb-6">
            Solutions for Every Need
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive educational gaming solutions designed for various
            learning environments and objectives.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr,2fr] gap-8">
          <div className="space-y-4">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <motion.div
                  key={solution.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                    activeSolution === index
                      ? "bg-white/10 shadow-lg"
                      : "hover:bg-white/5"
                  }`}
                  onClick={() => setActiveSolution(index)}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${solution.color}20` }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: solution.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{solution.title}</h3>
                      <p className="text-sm text-gray-400">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="pt-4"
            >
              <Link href="/#contact" scroll={false}>
                <Button
                  className="w-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] hover:opacity-90 text-white px-8 h-12 text-lg rounded-full"
                  onClick={() => {
                    document
                      .getElementById("contact")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSolution}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 rounded-xl p-6 backdrop-blur-sm"
            >
              <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                <Image
                  src={solutions[activeSolution].image}
                  alt={solutions[activeSolution].title}
                  fill
                  className="object-cover"
                  priority={activeSolution === 0}
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {solutions[activeSolution].title}
                  </h3>
                  <p className="text-white/80">
                    {solutions[activeSolution].description}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <ul className="flex flex-wrap gap-3">
                  {solutions[activeSolution].features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: solutions[activeSolution].color,
                        }}
                      />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
