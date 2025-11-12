"use client"

// import { motion } from 'framer-motion'
// import { FileText, Brain, Lightbulb } from 'lucide-react'

export default function Research() {
  return null;
}

/*
const studies = [
  {
    title: "Impact of Educational Games on Learning Outcomes",
    journal: "Journal of Educational Psychology",
    year: "2023",
    highlight: "47% improvement in knowledge retention through gamified learning",
    icon: Brain,
    color: "#6366F1"
  },
  {
    title: "AI-Enhanced Adaptive Learning Systems",
    journal: "Cognitive Science Quarterly",
    year: "2023",
    highlight: "83% of students showed improved engagement with AI-powered systems",
    icon: Lightbulb,
    color: "#22D3EE"
  },
  {
    title: "The Future of Educational Technology",
    journal: "Educational Research Review",
    year: "2023",
    highlight: "92% of institutions report positive ROI from educational gaming",
    icon: FileText,
    color: "#FF3B9A"
  }
]

export default function Research() {
  return (
    <section id="research" className="py-32 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-space font-bold mb-6">
            Backed by Science
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our platform is built on proven research in educational psychology, 
            cognitive science, and artificial intelligence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {studies.map((study, index) => {
            const Icon = study.icon
            return (
              <motion.div
                key={study.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${study.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: study.color }} />
                </div>
                <h3 className="text-xl font-bold mb-4">{study.title}</h3>
                <p className="text-gray-400 mb-4 text-sm">{study.journal}, {study.year}</p>
                <p className="text-lg font-semibold" style={{ color: study.color }}>
                  {study.highlight}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
*/
