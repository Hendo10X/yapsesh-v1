"use client";

import { VoiceMemoFeed } from "@/components/voice-memo-feed";
import { FloatingRecordButton } from "@/components/floating-record-button";

export default function FeedPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-akshar mb-8">Voice Memos</h1>
      <VoiceMemoFeed />
      <FloatingRecordButton />
    </div>
  );
}
