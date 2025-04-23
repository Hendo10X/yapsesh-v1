"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { TabNav } from "@/components/tab-nav";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "sonner";

export default function ProtectedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("for-you");

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
  }, [router, supabase]);

  const renderContent = () => {
    switch (activeTab) {
      case "for-you":
        return <div className="p-4">For You content goes here</div>;
      case "following":
        return <div className="p-4">Following content goes here</div>;
      case "polls":
        return <div className="p-4">Polls content goes here</div>;
      default:
        return null;
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex h-svh w-full flex-col items-center justify-start font-akshar">
        <Navbar />
        <div className="w-full max-w-4xl mt-20">
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          {renderContent()}
        </div>
      </div>
    </>
  );
}
