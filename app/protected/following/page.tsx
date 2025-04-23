"use client";

import { Navbar } from "@/components/navbar";
import { TabNav } from "@/components/tab-nav";
import { ProfileContent } from "@/components/profile-content";

export default function FollowingPage() {
  return (
    <div className="flex h-svh w-full flex-col items-center justify-start font-akshar">
      <Navbar />
      <div className="w-full max-w-4xl px-4">
        <ProfileContent />
        <TabNav />
        <div className="mt-8">
          {/* Following content will go here */}
          <h2 className="text-2xl font-medium">Following</h2>
          <p className="text-gray-500 mt-2">
            People you follow will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
