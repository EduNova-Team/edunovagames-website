"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

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

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
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
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 bg-white/10 border-white/20 backdrop-blur-md"
                  align="end"
                >
                  <DropdownMenuLabel className="text-white">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-xs leading-none text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="text-white hover:bg-white/10 cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                </Link>
                <Button
                  onClick={() => handleNavigation("/auth")}
                  className="bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:opacity-90"
                >
                  Get Started
                </Button>
              </div>
            )}

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
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {user.user_metadata?.full_name || "User"}
                        </p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link
                        href="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button
                          variant="outline"
                          className="w-full border-white/20 hover:bg-white/5 justify-start"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Profile Settings
                        </Button>
                      </Link>
                      <Button
                        onClick={handleSignOut}
                        variant="outline"
                        className="w-full border-red-500/20 hover:bg-red-500/10 text-red-400 justify-start"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/auth">
                      <Button
                        variant="outline"
                        className="w-full border-white/20 hover:bg-white/5"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleNavigation("/auth")}
                      className="w-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:opacity-90"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
