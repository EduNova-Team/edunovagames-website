//"use client";

//import { motion } from "framer-motion";
//import { MessageSquare, Code, Cpu, BarChart3 } from "lucide-react";
//import { Button } from "@/components/ui/button";
//import Link from "next/link";

export default function Services() {
  return null;
}
/*
const services = [
  {
    title: "AI Chatbots",
    description:
      "Intelligent chatbot teachers that provide personalized learning experiences and instant support to students across various subjects.",
    icon: MessageSquare,
    features: [
      "24/7 availability for student queries",
      "Personalized learning paths",
      "Multi-subject expertise",
      "Natural language processing",
    ],
    color: "#6366F1",
  },
  {
    title: "Software Development",
    description:
      "Custom educational software solutions designed to enhance learning experiences and streamline administrative processes.",
    icon: Code,
    features: [
      "Learning Management Systems (LMS)",
      "Interactive educational apps",
      "Virtual classroom platforms",
      "Student information systems",
    ],
    color: "#22D3EE",
  },
  {
    title: "AI Automation",
    description:
      "Leverage the power of AI to automate repetitive tasks, allowing educators to focus more on teaching and less on administration.",
    icon: Cpu,
    features: [
      "Automated grading systems",
      "Smart content creation",
      "Predictive analytics for student performance",
      "Intelligent scheduling and resource allocation",
    ],
    color: "#FF3B9A",
  },
  {
    title: "Analytics and Reporting",
    description:
      "Comprehensive data analysis and reporting tools to track student progress, identify trends, and make data-driven decisions.",
    icon: BarChart3,
    features: [
      "Real-time performance dashboards",
      "Custom report generation",
      "Learning outcome tracking",
      "Predictive analytics for student success",
    ],
    color: "#10B981",
  },
];

export const Services = () => {
  return (
    <section id="services" className="py-32 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-space font-bold mb-6">
            Our Services
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive AI-powered educational solutions designed to transform
            learning through cutting-edge technology
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${service.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: service.color }} />
                </div>

                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-gray-400 mb-6">{service.description}</p>

                <div className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: service.color }}
                      />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/#contact" scroll={false}>
            <Button
              className="bg-gradient-to-r from-[#6366F1] to-[#22D3EE] hover:opacity-90 text-white px-8 h-12 text-lg rounded-full"
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
    </section>
  );
};
*/