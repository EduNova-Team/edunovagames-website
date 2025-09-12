"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          router.push("/auth?error=" + encodeURIComponent(error.message));
          return;
        }

        if (data.session) {
          // Successfully authenticated, redirect to home
          router.push("/");
        } else {
          // No session, redirect to auth page
          router.push("/auth");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        router.push(
          "/auth?error=" + encodeURIComponent("An unexpected error occurred")
        );
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A16] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-400">
          Please wait while we finish setting up your account.
        </p>
      </div>
    </div>
  );
}
