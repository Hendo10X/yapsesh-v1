"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

export function ProfileContent() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center space-x-4">
      {session.user.image && (
        <div className="relative h-12 w-12 overflow-hidden rounded-full">
          <Image
            src={session.user.image}
            alt={session.user.name || "Profile picture"}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div>
        <h1 className="text-xl font-semibold">{session.user.name}</h1>
        <p className="text-sm text-gray-500">
          @{session.user.email?.split("@")[0]}
        </p>
      </div>
    </div>
  );
}
