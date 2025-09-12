"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface UserProfile {
  fullName: string;
  email: string;
  notifications: {
    email: boolean;
    push: boolean;
    quizReminders: boolean;
  };
  privacy: {
    showProgress: boolean;
    allowAnalytics: boolean;
  };
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    email: "",
    notifications: {
      email: true,
      push: true,
      quizReminders: true,
    },
    privacy: {
      showProgress: true,
      allowAnalytics: true,
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
      return;
    }

    if (user) {
      setProfile({
        fullName: user.user_metadata?.full_name || "",
        email: user.email || "",
        notifications: {
          email: true,
          push: true,
          quizReminders: true,
        },
        privacy: {
          showProgress: true,
          allowAnalytics: true,
        },
      });
    }
  }, [user, loading, router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Here you would typically update the user profile via Supabase
      // For now, we'll just simulate a save
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A16] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22D3EE] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0A16]">
      <Header />

      <main className="pt-24 pb-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#6366F1] via-[#22D3EE] to-[#FF3B9A] text-transparent bg-clip-text">
              Profile Settings
            </h1>
            <p className="text-xl text-gray-400">
              Manage your account settings and preferences
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="fullName"
                          type="text"
                          value={profile.fullName}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="pl-10 bg-white/5 border-white/10 text-gray-400"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notification Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          Email Notifications
                        </p>
                        <p className="text-sm text-gray-400">
                          Receive updates via email
                        </p>
                      </div>
                      <Button
                        variant={
                          profile.notifications.email ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              email: !prev.notifications.email,
                            },
                          }))
                        }
                        className={
                          profile.notifications.email
                            ? "bg-[#22D3EE] text-white"
                            : "border-white/20 hover:bg-white/5"
                        }
                      >
                        {profile.notifications.email ? "On" : "Off"}
                      </Button>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          Push Notifications
                        </p>
                        <p className="text-sm text-gray-400">
                          Receive browser notifications
                        </p>
                      </div>
                      <Button
                        variant={
                          profile.notifications.push ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              push: !prev.notifications.push,
                            },
                          }))
                        }
                        className={
                          profile.notifications.push
                            ? "bg-[#22D3EE] text-white"
                            : "border-white/20 hover:bg-white/5"
                        }
                      >
                        {profile.notifications.push ? "On" : "Off"}
                      </Button>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Quiz Reminders</p>
                        <p className="text-sm text-gray-400">
                          Get reminded to practice
                        </p>
                      </div>
                      <Button
                        variant={
                          profile.notifications.quizReminders
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              quizReminders: !prev.notifications.quizReminders,
                            },
                          }))
                        }
                        className={
                          profile.notifications.quizReminders
                            ? "bg-[#22D3EE] text-white"
                            : "border-white/20 hover:bg-white/5"
                        }
                      >
                        {profile.notifications.quizReminders ? "On" : "Off"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Privacy Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy & Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          Show Progress Publicly
                        </p>
                        <p className="text-sm text-gray-400">
                          Allow others to see your quiz progress
                        </p>
                      </div>
                      <Button
                        variant={
                          profile.privacy.showProgress ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            privacy: {
                              ...prev.privacy,
                              showProgress: !prev.privacy.showProgress,
                            },
                          }))
                        }
                        className={
                          profile.privacy.showProgress
                            ? "bg-[#22D3EE] text-white"
                            : "border-white/20 hover:bg-white/5"
                        }
                      >
                        {profile.privacy.showProgress ? "On" : "Off"}
                      </Button>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          Allow Analytics
                        </p>
                        <p className="text-sm text-gray-400">
                          Help improve our platform with usage data
                        </p>
                      </div>
                      <Button
                        variant={
                          profile.privacy.allowAnalytics ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            privacy: {
                              ...prev.privacy,
                              allowAnalytics: !prev.privacy.allowAnalytics,
                            },
                          }))
                        }
                        className={
                          profile.privacy.allowAnalytics
                            ? "bg-[#22D3EE] text-white"
                            : "border-white/20 hover:bg-white/5"
                        }
                      >
                        {profile.privacy.allowAnalytics ? "On" : "Off"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex justify-center"
            >
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white hover:opacity-90 px-8 h-12 text-lg"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </motion.div>

            {/* Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-500/10 border border-green-500/20 text-green-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>{message.text}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
