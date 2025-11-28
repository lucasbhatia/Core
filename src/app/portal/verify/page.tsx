"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPortalToken } from "@/app/actions/portal-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function PortalVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setError("Invalid link. No token provided.");
        return;
      }

      try {
        const result = await verifyPortalToken(token);

        if (result.success) {
          setStatus("success");
          // Redirect to portal after a short delay
          setTimeout(() => {
            router.push("/portal");
          }, 1500);
        } else {
          setStatus("error");
          setError(result.error || "Verification failed");
        }
      } catch (err) {
        setStatus("error");
        setError("Something went wrong. Please try again.");
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <CardTitle>Verifying...</CardTitle>
              <CardDescription>
                Please wait while we verify your access link
              </CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Welcome Back!</CardTitle>
              <CardDescription>
                Redirecting you to your portal...
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Verification Failed</CardTitle>
              <CardDescription>{error}</CardDescription>
            </>
          )}
        </CardHeader>

        {status === "error" && (
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/portal/login">Request New Link</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
