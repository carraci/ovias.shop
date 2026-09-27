"use client";

import { AuthExperience } from "./auth-experience";

export function RecoveryForm({
  mode,
  verificationEmail = "",
  onComplete,
}: {
  mode:
    | "forgot-password"
    | "reset-password"
    | "verify-email"
    | "verify-account";
  verificationEmail?: string;
  onComplete?: () => void;
}) {
  return (
    <AuthExperience
      initialMode={mode}
      verificationEmail={verificationEmail}
      onComplete={onComplete}
    />
  );
}
