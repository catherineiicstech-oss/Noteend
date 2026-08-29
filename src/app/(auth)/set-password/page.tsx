import type { Metadata } from "next";
import { Suspense } from "react";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export const metadata: Metadata = { title: "Set your password" };

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  );
}
