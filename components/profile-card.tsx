"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  display_name: string;
  photo_url: string | null;
  bio?: string;
  followers_count?: number;
  following_count?: number;
}

export function ProfileCard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) throw error;
        setProfile(data);
        setNewDisplayName(data.display_name);
        setNewBio(data.bio || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, supabase]);

  const handleSave = async () => {
    try {
      let photoUrl = profile?.photo_url;

      if (selectedFile) {
        // Delete old photo if it exists
        if (profile?.photo_url) {
          const oldPath = profile.photo_url.split("/").pop();
          if (oldPath) {
            await supabase.storage
              .from("avatars")
              .remove([`${userId}/${oldPath}`]);
          }
        }

        // Upload new photo
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(`${userId}/avatar`, selectedFile, {
            upsert: true,
          });

        if (uploadError) throw uploadError;
        photoUrl = uploadData.path;
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          display_name: newDisplayName,
          bio: newBio,
          photo_url: photoUrl || null,
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          display_name: newDisplayName,
          bio: newBio,
          photo_url: photoUrl || null,
        };
      });

      setIsEditing(false);
      setSelectedFile(null);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.display_name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16">
            {profile.photo_url && (
              <AvatarImage src={profile.photo_url} alt={profile.display_name} />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {isEditing && (
            <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </label>
          )}
        </div>
        <div className="flex flex-col flex-grow">
          {isEditing ? (
            <Input
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="mb-2"
            />
          ) : (
            <h3 className="text-xl font-semibold">{profile.display_name}</h3>
          )}
          {isEditing ? (
            <Input
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              placeholder="Add a bio"
            />
          ) : (
            profile.bio && (
              <p className="text-sm text-gray-500">{profile.bio}</p>
            )
          )}
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}>
          {isEditing ? "Save" : "Edit Profile"}
        </Button>
      </div>

      <div className="flex gap-8 text-sm">
        <div className="flex flex-col items-center">
          <span className="font-semibold text-lg">
            {profile.followers_count || 0}
          </span>
          <span className="text-gray-500">Followers</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-lg">
            {profile.following_count || 0}
          </span>
          <span className="text-gray-500">Following</span>
        </div>
      </div>
    </div>
  );
}
