"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

interface VoiceMemoProps {
  userId: string;
  onUpdate: () => void;
}

export function VoiceMemo({ userId, onUpdate }: VoiceMemoProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchVoiceMemo = async () => {
      try {
        console.log("Fetching voice memo for user:", userId);
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("voice_memo_url")
          .eq("user_id", userId)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return;
        }

        console.log("Profile data:", profile);

        if (profile?.voice_memo_url) {
          console.log("Found voice memo URL:", profile.voice_memo_url);
          const { data } = supabase.storage
            .from("voice-memos")
            .getPublicUrl(profile.voice_memo_url);
          console.log("Generated public URL:", data.publicUrl);
          setAudioUrl(data.publicUrl);
        } else {
          console.log("No voice memo URL found in profile");
        }
      } catch (error) {
        console.error("Error in fetchVoiceMemo:", error);
      }
    };

    fetchVoiceMemo();
  }, [userId, supabase]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => {
          if (prev >= 180) {
            stopRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (audioUrl) {
      console.log("Setting up audio element with URL:", audioUrl);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        console.log("Audio playback ended");
        setIsPlaying(false);
      };
      audioRef.current.onerror = (error) => {
        console.error("Audio playback error:", error);
        setIsPlaying(false);
      };
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const fileName = `${userId}/voice-memo-${Date.now()}.webm`;

        try {
          console.log("Attempting to upload voice memo to Supabase storage...");
          const { error } = await supabase.storage
            .from("voice-memos")
            .upload(fileName, audioBlob, {
              upsert: true,
            });

          if (error) {
            console.error("Error uploading to storage:", error);
            throw error;
          }

          console.log("Successfully uploaded to storage, updating profile...");
          const { error: updateError } = await supabase
            .from("user_profiles")
            .update({ voice_memo_url: fileName })
            .eq("user_id", userId);

          if (updateError) {
            console.error("Error updating profile:", updateError);
            throw updateError;
          }

          console.log("Getting public URL for voice memo...");
          const { data: urlData } = supabase.storage
            .from("voice-memos")
            .getPublicUrl(fileName);
          setAudioUrl(urlData.publicUrl);
          onUpdate();
          toast.success("Voice memo saved!");
        } catch (error) {
          console.error("Error in voice memo upload process:", error);
          toast.error("Failed to save voice memo. Please try again.");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const handlePlayPause = () => {
    console.log("Play/Pause clicked. Current state:", {
      isPlaying,
      hasAudioRef: !!audioRef.current,
      audioUrl,
    });

    if (audioRef.current) {
      if (isPlaying) {
        console.log("Pausing audio");
        audioRef.current.pause();
      } else {
        console.log("Playing audio");
        audioRef.current
          .play()
          .then(() => {
            console.log("Audio started playing successfully");
          })
          .catch((error) => {
            console.error("Error playing audio:", error);
            toast.error("Failed to play audio");
          });
      }
      setIsPlaying(!isPlaying);
    } else {
      console.error("No audio reference available");
      toast.error("No audio available to play");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            className="rounded-full h-12 w-12">
            {isRecording ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlayPause}
            disabled={!audioUrl}
            className="rounded-full h-12 w-12">
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </Button>
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-gray-500">
                {formatTime(duration)}
              </span>
            </div>
          )}
        </div>
      </div>
      {isRecording && (
        <>
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${(duration / 180) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center">
            You can record up to 3 minutes
          </p>
        </>
      )}
    </div>
  );
}
