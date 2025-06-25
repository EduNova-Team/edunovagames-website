"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    if (path.startsWith("/#")) {
      // If we're on the home page, scroll to the section
      if (window.location.pathname === "/") {
        const element = document.getElementById(path.substring(2));
        element?.scrollIntoView({ behavior: "smooth" });
      } else {
        // If we're on another page, navigate to home and then scroll
        router.push(`${path}`);
      }
    } else {
      router.push(path);
    }
  };

  return (
    <header className="border-b border-white/10 bg-[#0A0A16]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CTSO%20GAMES%20logo-jCxxiz42YYhpH54hwjjcQHXBQsOFyY.png"
                alt="EduNova Games Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-space font-bold text-xl">EduNova Games</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/mini-games"
              className="text-sm text-gray-300 hover:text-white transition-colors relative group"
            >
              Mini-Games
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366F1] to-[#22D3EE] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/fbla"
              className="text-sm text-gray-300 hover:text-white transition-colors relative group"
            >
              FBLA
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366F1] to-[#22D3EE] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <button
              onClick={() => handleNavigation("/#services")}
              className="text-sm text-gray-300 hover:text-white transition-colors relative group"
            >
              Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366F1] to-[#22D3EE] group-hover:w-full transition-all duration-300"></span>
            </button>
            <button
              onClick={() => handleNavigation("/#research")}
              className="text-sm text-gray-300 hover:text-white transition-colors relative group"
            >
              Research
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366F1] to-[#22D3EE] group-hover:w-full transition-all duration-300"></span>
            </button>
            <button
              onClick={() => handleNavigation("/contact")}
              className="text-sm text-gray-300 hover:text-white transition-colors relative group"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366F1] to-[#22D3EE] group-hover:w-full transition-all duration-300"></span>
            </button>
          </nav>

          <div className="flex items-center">
            <Button
              onClick={() => handleNavigation("/contact")}
              className="bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:opacity-90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
