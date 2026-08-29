import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-ink-600">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-accent-700 hover:text-accent-800">
          Sign in
        </Link>
      </p>
    </>
  );
}
