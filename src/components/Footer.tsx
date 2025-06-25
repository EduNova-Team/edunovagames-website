import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A16] border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CTSO%20GAMES%20logo-jCxxiz42YYhpH54hwjjcQHXBQsOFyY.png"
                  alt="EduNova Games Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-space font-bold text-xl">
                EduNova Games
              </span>
            </Link>
            <p className="text-gray-400">
              Making learning fun and effective through gamification.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/mini-games"
                  className="text-gray-400 hover:text-[#22D3EE] transition-colors"
                >
                  Mini-Games
                </Link>
              </li>
              <li>
                <Link
                  href="/fbla"
                  className="text-gray-400 hover:text-[#22D3EE] transition-colors"
                >
                  FBLA
                </Link>
              </li>
              <li>
                <Link
                  href="/#services"
                  className="text-gray-400 hover:text-[#22D3EE] transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/#research"
                  className="text-gray-400 hover:text-[#22D3EE] transition-colors"
                >
                  Research
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-[#22D3EE] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/legal/privacy-policy"
                  className="text-gray-400 hover:text-[#22D3EE] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms-of-service"
                  className="text-gray-400 hover:text-[#22D3EE] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookie-policy"
                  className="text-gray-400 hover:text-[#22D3EE] transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Newsletter</h3>
            <p className="text-gray-400 mb-4">
              Stay updated with our latest features and releases.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/5 border-white/10 focus:border-[#6366F1]"
              />
              <Button className="bg-gradient-to-r from-[#6366F1] to-[#22D3EE] hover:opacity-90">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} EduNova Games. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
