"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigation = (path: string) => {
    setIsMobileMenuOpen(false); // Close mobile menu when navigating
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-white transition-colors relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366F1] to-[#22D3EE] group-hover:w-full transition-all duration-300"></span>
            </Link>
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

          <div className="flex items-center gap-4">
            {/* Desktop Get Started Button */}
            <Button
              onClick={() => handleNavigation("/contact")}
              className="hidden md:block bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:opacity-90"
            >
              Get Started
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex flex-col justify-center items-center w-6 h-6 space-y-1"
              aria-label="Toggle mobile menu"
            >
              <span
                className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              ></span>
              <span
                className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : ""
                }`}
              ></span>
              <span
                className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              ></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0A0A16]/95 backdrop-blur-md border-b border-white/10">
            <nav className="container mx-auto px-4 py-6 space-y-4">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg text-gray-300 hover:text-white transition-colors py-2"
              >
                Home
              </Link>
              <Link
                href="/mini-games"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg text-gray-300 hover:text-white transition-colors py-2"
              >
                Mini-Games
              </Link>
              <Link
                href="/fbla"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg text-gray-300 hover:text-white transition-colors py-2"
              >
                FBLA
              </Link>
              <button
                onClick={() => handleNavigation("/#services")}
                className="block w-full text-left text-lg text-gray-300 hover:text-white transition-colors py-2"
              >
                Services
              </button>
              <button
                onClick={() => handleNavigation("/#research")}
                className="block w-full text-left text-lg text-gray-300 hover:text-white transition-colors py-2"
              >
                Research
              </button>
              <button
                onClick={() => handleNavigation("/contact")}
                className="block w-full text-left text-lg text-gray-300 hover:text-white transition-colors py-2"
              >
                Contact
              </button>
              <div className="pt-4 border-t border-white/10">
                <Button
                  onClick={() => handleNavigation("/contact")}
                  className="w-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:opacity-90"
                >
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
