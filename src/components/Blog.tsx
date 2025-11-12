"use client"

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const posts = [

  {
    title: "How AI could soon be marking your child's homework",
    excerpt: 'Almost half of teachers are already using AI in some form to help with their work.',
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pexels-rethaferguson-3059750.jpg-zLqvIL2eu3hCZUtNRWenscULUaYCkk.jpeg",
    category: "Education",
    date: "Feb 2024",
    source: "The Times",
    url: "https://www.thetimes.com/uk/education/article/how-ai-could-soon-be-marking-your-childs-homework-k9r7878c7"
  },
  
    {
      title: "Will AI revolutionise education for the better?",
      excerpt: 'School students in Ghana who used an AI-powered maths tutor...had \'substantially higher\' maths growth scores compared to peers in a control group.',
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pexels-pavel-danilyuk-8438922.jpg-5u9hI2MvHINyGtu07GQVjkn3z9UhVb.jpeg",
      category: "AI Research",
      date: "Jun 2024",
      source: "Financial Times",
      url: "https://www.ft.com/content/dd777c4e-31da-47bc-8241-91d39fe8020c"
    },
  {
    title: "AI and gamification can supercharge language learning",
    excerpt: 'The cofounder of the world’s largest education app thinks AI and gamification can supercharge language learning.',
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pexels-googledeepmind-17483874.jpg-THVoVHD285BhBK9ttEIuDSlbK8Xt5c.jpeg",
    category: "Case Study",
    date: "Oct 2024",
    source: "The Verge",
    url: "https://www.theverge.com/24267841/luis-von-ahn-duolingo-owl-language-learning-gamification-generative-ai-android-decoder"
  }

  
    
]

export default function Blog() {
  return (
    <section id="news" className="py-20 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-space font-bold mb-6">
            Latest Research Insights
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Stay informed with the latest research and developments in AI-powered educational gaming
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A16] via-transparent to-transparent opacity-60" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 text-xs rounded-full bg-white/10 backdrop-blur-sm text-white font-mono">
                    {post.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6 space-y-4 flex flex-col flex-grow">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span className="font-medium text-[#22D3EE]">{post.source}</span>
                  <span>{post.date}</span>
                </div>
                
                <h3 className="text-xl font-bold group-hover:text-[#22D3EE] transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-gray-400 flex-grow">
                  {post.excerpt}
                </p>
                
                <Link href={post.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#22D3EE] font-medium pt-2 group">
                  <span className="font-mono">Read full article</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

