"use client";

import { motion } from "framer-motion";
import { Brain, Zap, BarChart3, Cpu } from "lucide-react";

export default function AISection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-space font-bold mb-6">
            Powered by Advanced AI
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our cutting-edge AI technology enhances every aspect of the learning
            experience, from personalized content delivery to real-time
            performance analysis.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative aspect-video rounded-xl overflow-hidden"
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/18069234-hd_1080_1080_24fps-uBWDRiGuIDxZfPtFw6cGy6jGE8tPRh.mp4"
                type="video/mp4"
              />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A16]/20 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {[
              {
                icon: Brain,
                title: "Adaptive Learning Paths",
                description:
                  "AI algorithms create personalized learning journeys based on individual progress and learning style.",
                color: "#6366F1",
              },
              {
                icon: Zap,
                title: "Real-time Feedback",
                description:
                  "Instant, intelligent feedback helps students understand and correct mistakes immediately.",
                color: "#22D3EE",
              },
              {
                icon: BarChart3,
                title: "Predictive Analytics",
                description:
                  "Advanced data analysis predicts areas where students may struggle, allowing for proactive intervention.",
                color: "#FF3B9A",
              },
              {
                icon: Cpu,
                title: "Content Optimization",
                description:
                  "AI continuously refines and optimizes educational content based on performance data across all users.",
                color: "#10B981",
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start space-x-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: feature.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
