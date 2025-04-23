import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex justify-center items-center pt-6">
              <Image src="/YapSesh.svg" alt="logo" width={70} height={70} />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Check your email
              </CardTitle>
              <CardDescription className="text-center">
                We&apos;ve sent you a verification link to your email address.
                Please click the link to verify your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Once verified, you can proceed with setting up your profile.
              </p>
              <div className="flex justify-center">
                <Link href="/auth/login">
                  <Button variant="outline">Return to login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
