"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState, useRef } from "react";
import { toast } from "sonner";

export function RecordModal() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const supabase = createClient();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const fileName = `voice-memo-${Date.now()}.webm`;

        try {
          const { error } = await supabase.storage
            .from("voice-memos")
            .upload(fileName, audioBlob, {
              upsert: true,
            });

          if (error) throw error;

          toast.success("Recording saved successfully!");
        } catch (error) {
          console.error("Error saving recording:", error);
          toast.error("Failed to save recording");
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUploadAudio = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `voice-memo-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage
        .from("voice-memos")
        .upload(fileName, file, {
          upsert: true,
        });

      if (error) throw error;

      toast.success("Audio uploaded successfully!");
    } catch (error) {
      console.error("Error uploading audio:", error);
      toast.error("Failed to upload audio");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:text-black"
        onClick={isRecording ? stopRecording : startRecording}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
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
        <span className="font-medium font-akshar">Record Now</span>
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
          className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-blue-50"
          onClick={() => document.getElementById("audio-upload")?.click()}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
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
          {(duration % 60).toString().padStart(2, "0")}
        </div>
      )}
    </div>
  );
}
