"use client";

import { VoiceMemoFeed } from "@/components/voice-memo-feed";
import { FloatingRecordButton } from "@/components/floating-record-button";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function FeedPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [supabase]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-akshar mb-8">Voice Memos</h1>
      <VoiceMemoFeed />
      {userId && <FloatingRecordButton userId={userId} />}
    </div>
  );
}
