"use client";

import { LogoutButton } from "./logout-button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

interface UserProfile {
  photo_url: string | null;
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Fetch user profile
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("photo_url")
          .eq("user_id", user.id)
          .single();

        setProfile(profileData);
      }
    };

    getUserData();
  }, [supabase]);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white mt-2">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/protected" className="flex items-center">
          <Image src="/YapSesh.svg" alt="YapSesh Logo" width={70} height={70} />
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          {profile?.photo_url ? (
            <Image
              src={profile.photo_url}
              alt="User avatar"
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm text-gray-500">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Logout Button */}
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
