import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2 font-akshar">
      <p className="text-xl font-light">
        Hello <span>{data.user.email}</span>
      </p>
      <div className="flex  gap-2">
        <div className="flex flex-col gap-2">
          <LogoutButton />
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline">
            <Link href="/auth/update-password">Update Password</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
