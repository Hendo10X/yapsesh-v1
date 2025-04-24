"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { TabNav } from "@/components/tab-nav";
import { ProfileCard } from "@/components/profile-card";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingRecordButton } from "@/components/floating-record-button";

export default function ProtectedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("for-you");
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      setCurrentUser(user.id);

      // Fetch user profile data
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("display_name, photo_url")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      if (!profile) {
        toast.info("No profile found, redirecting to onboarding");
        router.push("/protected/onboarding");
        return;
      }
    };

    checkUserAndProfile();

    // Add event listener for tab changes
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener("tabChange", handleTabChange as EventListener);

    return () => {
      window.removeEventListener("tabChange", handleTabChange as EventListener);
    };
  }, [router, supabase]);

  const renderContent = () => {
    switch (activeTab) {
      case "for-you":
        return (
          <motion.div
            key="for-you"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="mt-4 p-4">
            <motion.h2
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold mb-4">
              Your Feed
            </motion.h2>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4">
              <div className="p-1">
                <p className="text-gray-600">
                  Your personalized content will appear here
                </p>
              </div>
            </motion.div>
          </motion.div>
        );
      case "following":
        return (
          <motion.div
            key="following"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="mt-4 p-4">
            <motion.h2
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold mb-4">
              Following
            </motion.h2>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4">
              <div className="p-1">
                <p className="text-gray-600">
                  Content from people you follow will appear here
                </p>
              </div>
            </motion.div>
          </motion.div>
        );
      case "polls":
        return (
          <motion.div
            key="polls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className=" mt-4 p-4">
            <h2 className="text-xl font-semibold mb-4">Active Polls</h2>
            <div className="space-y-4">
              <div className="p-1">
                <p className="text-gray-600">Active polls will appear here</p>
              </div>
            </div>
          </motion.div>
        );
      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="mt-4 p-4">
            <motion.h2
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold mb-4">
              Your Profile
            </motion.h2>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4">
              {currentUser && <ProfileCard userId={currentUser} />}
            </motion.div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex h-svh w-full flex-col items-center justify-start font-akshar">
        <Navbar />
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: 0.2,
          }}
          className="w-full max-w-4xl mt-20">
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </motion.div>
        {(activeTab === "for-you" || activeTab === "following") &&
          currentUser && <FloatingRecordButton userId={currentUser} />}
      </motion.div>
    </>
  );
}
