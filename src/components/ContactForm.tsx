"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    institutionType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [, setResult] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult("Sending....");

    try {
      const form = new FormData();
      form.append("access_key", "dd9c4dcb-8c79-440c-94a3-66bac699882a");

      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus("success");
        setResult("Form Submitted Successfully");
        setFormData({
          name: "",
          email: "",
          company: "",
          role: "",
          institutionType: "",
          message: "",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error: unknown) {
      setSubmitStatus("error");
      setResult(
        error instanceof Error ? error.message : "Something went wrong!"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-32 bg-[#0A0A16]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-transparent bg-clip-text">
            Get Started with EduNova Games
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Tell us about your institution and needs. We will tailor our
            AI-powered educational gaming solutions to fit your specific
            requirements.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-300"
                >
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="bg-[#0A0A16] border-white/10 text-white placeholder:text-gray-500 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-300"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="bg-[#0A0A16] border-white/10 text-white placeholder:text-gray-500 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="company"
                  className="text-sm font-medium text-gray-300"
                >
                  Company/Institution
                </label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  placeholder="Acme University"
                  className="bg-[#0A0A16] border-white/10 text-white placeholder:text-gray-500 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="role"
                  className="text-sm font-medium text-gray-300"
                >
                  Your Role
                </label>
                <Input
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Director of Technology"
                  className="bg-[#0A0A16] border-white/10 text-white placeholder:text-gray-500 rounded-md"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="institutionType"
                className="text-sm font-medium text-gray-300"
              >
                Institution Type
              </label>
              <Select
                name="institutionType"
                onValueChange={(value) =>
                  handleSelectChange("institutionType", value)
                }
              >
                <SelectTrigger className="bg-[#0A0A16] border-white/10 text-white rounded-md">
                  <SelectValue placeholder="Select institution type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="k12">K-12 School</SelectItem>
                  <SelectItem value="highered">Higher Education</SelectItem>
                  <SelectItem value="corporate">Corporate Training</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="message"
                className="text-sm font-medium text-gray-300"
              >
                Tell us about your needs
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Describe your institution's specific requirements or challenges..."
                className="bg-[#0A0A16] border-white/10 text-white placeholder:text-gray-500 rounded-md min-h-[100px]"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:opacity-90 h-12 text-lg rounded-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Get Started"
              )}
            </Button>
          </form>

          {submitStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-center"
            >
              Thank you for your interest! We will be in touch shortly to
              discuss how we can tailor our solutions to your needs.
            </motion.div>
          )}

          {submitStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center"
            >
              An error occurred. Please try again or contact us directly.
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
