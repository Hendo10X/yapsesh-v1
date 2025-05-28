"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface VoiceMemo {
  id: string;
  user_id: string;
  title: string;
  audio_url: string;
  duration: number;
  created_at: string;
  is_published: boolean;
  likes_count: number;
  comments_count: number;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

export function VoiceMemoFeed() {
  const [voiceMemos, setVoiceMemos] = useState<VoiceMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchVoiceMemos = useCallback(async () => {
    try {
      console.log("Fetching voice memos...");
      const { data, error } = await supabase
        .from("voice_memos")
        .select(
          `
          *,
          user:user_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching voice memos:", error);
        throw error;
      }

      console.log("Fetched voice memos:", data);
      setVoiceMemos(data || []);
    } catch (error) {
      console.error("Error in fetchVoiceMemos:", error);
      setVoiceMemos([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    console.log("Setting up voice memos subscription...");
    fetchVoiceMemos();

    const channel = supabase
      .channel("voice_memos_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "voice_memos",
        },
        (payload) => {
          console.log("Received voice memo change:", payload);
          fetchVoiceMemos();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up voice memos subscription...");
      supabase.removeChannel(channel);
    };
  }, [fetchVoiceMemos, supabase]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleLike = async (memoId: string) => {
    try {
      const { error } = await supabase
        .from("voice_memos")
        .update({ likes_count: supabase.rpc("increment") })
        .eq("id", memoId);

      if (error) throw error;
    } catch (error) {
      console.error("Error liking voice memo:", error);
      toast.error("Failed to like voice memo");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500">
        Loading voice memos...
      </div>
    );
  }

  if (voiceMemos.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">No voice memos yet</div>
        <div className="text-sm text-gray-400">
          Record your first voice memo using the microphone button below
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {voiceMemos.map((memo) => (
        <div key={memo.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarImage src={memo.user?.avatar_url} />
              <AvatarFallback>
                {memo.user?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {memo.user?.full_name || "Unknown User"}
              </div>
              <div className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(memo.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
          <div className="mb-2 font-medium text-lg">{memo.title}</div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <span>Duration: {formatDuration(memo.duration)}</span>
          </div>
          <audio
            controls
            className="w-full mb-4"
            src={memo.audio_url}
            preload="metadata">
            Your browser does not support the audio element.
          </audio>
          <div className="flex items-center gap-6 text-gray-500">
            <button
              onClick={() => handleLike(memo.id)}
              className="flex items-center gap-2 hover:text-red-500 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <span>{memo.likes_count || 0}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{memo.comments_count || 0}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
