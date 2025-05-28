"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface RecordModalProps {
  userId: string;
}

export function RecordModal({ userId }: RecordModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();
  const MAX_DURATION = 180; // 3 minutes in seconds

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording, stopRecording]);

  const startRecording = async () => {
    try {
      console.log("Starting recording process...");

      // Request audio permissions with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100,
        },
      });

      console.log(
        "Audio stream obtained:",
        stream.getAudioTracks()[0].getSettings()
      );
      streamRef.current = stream;

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder is not supported in this browser");
      }

      // Get supported MIME types
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      console.log("Using MIME type:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000,
      });

      console.log("MediaRecorder created with state:", mediaRecorder.state);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setAudioUrl(null);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("Audio chunk received:", event.data.size, "bytes");
          audioChunksRef.current.push(event.data);
        } else {
          console.warn("Received empty audio chunk");
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording error occurred");
        stopRecording();
      };

      mediaRecorder.onstop = async () => {
        try {
          console.log(
            "Recording stopped, chunks:",
            audioChunksRef.current.length
          );
          if (audioChunksRef.current.length === 0) {
            throw new Error("No audio data recorded");
          }

          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType,
          });
          console.log("Audio blob created:", audioBlob.size, "bytes");

          // Test if the blob is valid
          if (audioBlob.size === 0) {
            throw new Error("Generated audio blob is empty");
          }

          // Create a local URL for immediate playback
          const localUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(localUrl);
          toast.success(
            "Recording completed! You can now preview and post it."
          );
        } catch (error) {
          console.error("Error in recording process:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to process recording"
          );
        }
      };

      // Start recording with a larger timeslice to prevent frequent stops
      mediaRecorder.start(1000);
      setIsRecording(true);
      setDuration(0);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const handlePost = async () => {
    if (!audioUrl) return;
    setIsPosting(true);
    try {
      // Create a new blob from the audio chunks
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || "audio/webm",
      });

      if (audioBlob.size === 0) {
        throw new Error("No audio data to upload");
      }

      console.log("Audio blob size:", audioBlob.size, "bytes");

      const fileName = `voice-memo-${Date.now()}.webm`;
      console.log("Uploading file:", fileName);

      // Upload the audio file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("voice-memos")
        .upload(fileName, audioBlob, {
          upsert: true,
          contentType: mediaRecorderRef.current?.mimeType || "audio/webm",
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      console.log("File uploaded successfully:", uploadData);

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("voice-memos").getPublicUrl(fileName);

      console.log("Public URL:", publicUrl);

      // Save directly to database with is_published set to true
      const { data: insertData, error: dbError } = await supabase
        .from("voice_memos")
        .insert({
          user_id: userId,
          title: title || `Voice Memo ${new Date().toLocaleString()}`,
          audio_url: publicUrl,
          duration: duration,
          created_at: new Date().toISOString(),
          is_published: true,
        })
        .select();

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log("Database insert successful:", insertData);

      toast.success("Voice memo posted to feed!");

      // Close the modal after successful post
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const closeButton = dialog.querySelector('button[aria-label="Close"]');
        if (closeButton) {
          (closeButton as HTMLButtonElement).click();
        }
      }
    } catch (error) {
      console.error("Error posting to feed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to post to feed"
      );
    } finally {
      setIsPosting(false);
    }
  };

  const handleUploadAudio = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const fileName = `voice-memo-${Date.now()}.${file.name.split(".").pop()}`;

      // Upload audio file to storage
      const { error: uploadError } = await supabase.storage
        .from("voice-memos")
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("voice-memos").getPublicUrl(fileName);

      // Save metadata to database
      const { error: dbError } = await supabase.from("voice_memos").insert({
        user_id: user.id,
        title: title || file.name,
        audio_url: publicUrl,
        duration: 0,
      });

      if (dbError) throw dbError;

      const localUrl = URL.createObjectURL(file);
      setAudioUrl(localUrl);
      toast.success("Audio uploaded successfully!");
    } catch (error) {
      console.error("Error uploading audio:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload audio"
      );
    }
  };

  return (
    <div className="grid gap-4">
      <Input
        placeholder="Give your voice memo a title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="font-akshar border-blue-100 focus:border-blue-300"
      />
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className={`h-24 w-full flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
            isRecording
              ? "bg-red-50 border-red-200 hover:bg-red-100"
              : "hover:bg-blue-50 border-blue-100"
          }`}
          onClick={isRecording ? stopRecording : startRecording}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-8 w-8 ${
              isRecording ? "text-red-500 animate-pulse" : "text-blue-500"
            }`}
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
          <span className="font-medium font-akshar">
            {isRecording ? "Stop Recording" : "Record Now"}
          </span>
        </Button>
        <div className="relative">
          <input
            type="file"
            accept="audio/*"
            onChange={handleUploadAudio}
            className="hidden"
            id="audio-upload"
          />
          <Button
            variant="outline"
            className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-blue-50 border-blue-100"
            onClick={() => document.getElementById("audio-upload")?.click()}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="font-medium font-akshar">Upload Audio</span>
          </Button>
        </div>
        {isRecording && (
          <div className="col-span-2 text-center text-sm text-gray-500">
            Recording... {Math.floor(duration / 60)}:
            {(duration % 60).toString().padStart(2, "0")} / 3:00
          </div>
        )}
        {audioUrl && (
          <div className="col-span-2 space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <audio
                ref={audioRef}
                controls
                className="w-full"
                src={audioUrl}
                preload="metadata">
                Your browser does not support the audio element.
              </audio>
            </div>
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
              onClick={handlePost}
              disabled={isPosting}>
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post to Feed"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
