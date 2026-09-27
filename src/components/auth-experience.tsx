"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, Eye, EyeOff, Mail, Check, AlertCircle } from "lucide-react";
import { request, useStore } from "@/components/store-provider";

export type AuthMode =
  | "sign-in"
  | "register"
  | "password-step1"
  | "password-step2"
  | "password-step3"
  | "verify-account";

interface AuthExperienceProps {
  initialMode?:
    | "sign-in"
    | "register"
    | "forgot-password"
    | "reset-password"
    | "verify-email"
    | "verify-account";
  verificationEmail?: string;
  onComplete?: () => void;
}

export function AuthExperience({
  initialMode = "sign-in",
  verificationEmail = "",
  onComplete,
}: AuthExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { refresh, notify } = useStore();

  // Determine initial step
  const getInitialStep = (): AuthMode => {
    if (initialMode === "forgot-password") return "password-step1";
    if (initialMode === "reset-password") return "password-step3";
    if (initialMode === "verify-email" || initialMode === "verify-account")
      return "password-step2";
    if (initialMode === "register") return "register";
    return "sign-in";
  };

  const [mode, setMode] = useState<AuthMode>(getInitialStep());
  const [email, setEmail] = useState(verificationEmail || "adsh@gmail.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Token & Timers
  const [resetToken, setResetToken] = useState("");
  const [seconds, setSeconds] = useState(42);
  const [resendAt, setResendAt] = useState(Date.now() + 42_000);

  // Status & Visibility
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  // Sync mode with pathname changes
  useEffect(() => {
    if (pathname.includes("/forgot-password")) setMode("password-step1");
    else if (pathname.includes("/reset-password")) setMode("password-step3");
    else if (pathname.includes("/register")) setMode("register");
    else if (pathname.includes("/sign-in") || pathname.includes("/login"))
      setMode("sign-in");
  }, [pathname]);

  // Timer countdown
  useEffect(() => {
    const update = () =>
      setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [resendAt]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Switch mode helper and update URL without full reload
  const navigateTo = (newMode: AuthMode) => {
    setError("");
    setSuccessMsg("");
    setMode(newMode);
    if (newMode === "sign-in") {
      window.history.pushState({}, "", "/account/sign-in");
    } else if (newMode === "register") {
      window.history.pushState({}, "", "/account/register");
    } else if (newMode === "password-step1") {
      window.history.pushState({}, "", "/account/forgot-password");
    } else if (newMode === "password-step3") {
      window.history.pushState({}, "", "/account/reset-password");
    }
  };

  // OTP handlers
  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const copy = [...otpDigits];
      copy[index] = "";
      setOtpDigits(copy);
      return;
    }

    if (cleaned.length >= 6) {
      // Pasted full 6-digit code
      const pasted = cleaned.slice(0, 6).split("");
      setOtpDigits(pasted);
      otpInputsRef.current[5]?.focus();
      return;
    }

    const copy = [...otpDigits];
    copy[index] = cleaned[cleaned.length - 1];
    setOtpDigits(copy);

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        e.preventDefault();
        const copy = [...otpDigits];
        copy[index - 1] = "";
        setOtpDigits(copy);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const copy = [...otpDigits];
        copy[index] = "";
        setOtpDigits(copy);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const arr = pasted.split("");
      while (arr.length < 6) arr.push("");
      setOtpDigits(arr);
      otpInputsRef.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // Send recovery code (Step 1 -> Step 2)
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await request<{ message: string }>("auth/forgot-password", "POST", { email });
      setResendAt(Date.now() + 42_000);
      setSeconds(42);
      setOtpDigits(["", "", "", "", "", ""]);
      setAttemptsLeft(null);
      setMode("password-step2");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Verify OTP (Step 2 -> Step 3)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (initialMode === "verify-account" || initialMode === "verify-email") {
        const result = await request<{ message: string }>(
          "auth/verify-email",
          "POST",
          { email, otp: fullOtp },
        );
        notify(result.message);
        await refresh();
        onComplete?.();
        router.push("/account");
        return;
      }

      const result = await request<{ resetToken: string }>(
        "auth/verify-otp",
        "POST",
        { email, otp: fullOtp },
      );
      setResetToken(result.resetToken);
      setPassword("");
      setConfirmPassword("");
      setMode("password-step3");
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      const match = msg.match(/(\d+) of 5 attempts remaining/);
      if (match) setAttemptsLeft(Number(match[1]));
      else if (msg.includes("Too many attempts")) setAttemptsLeft(0);
    } finally {
      setBusy(false);
    }
  };

  // Reset Password (Step 3 -> Done)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/\d/.test(password)) {
      setError("Password must include at least one number.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must include at least one uppercase letter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const token =
        new URLSearchParams(window.location.search).get("token") || "";
      const result = await request<{ message: string }>(
        "auth/reset-password",
        "POST",
        resetToken
          ? { resetToken, newPassword: password }
          : { token, password },
      );
      notify(result.message || "Password successfully reset.");
      setSuccessMsg("Your password has been reset. Please sign in.");
      setPassword("");
      setConfirmPassword("");
      navigateTo("sign-in");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Sign In handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await request<{
        verificationRequired?: boolean;
        email?: string;
      }>("auth/login", "POST", { email, password });

      if (result.verificationRequired && result.email) {
        setEmail(result.email);
        setMode("password-step2");
        return;
      }
      await refresh();
      router.push("/account");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError("Please accept the terms and privacy policy to continue.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await request<{
        verificationRequired?: boolean;
        email?: string;
      }>("auth/register", "POST", {
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
        confirmPassword,
        terms: "on",
      });

      if (result.verificationRequired && result.email) {
        setEmail(result.email);
        setResendAt(Date.now() + 42_000);
        setSeconds(42);
        setMode("password-step2");
        return;
      }
      await refresh();
      router.push("/account");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Password criteria for Step 3 and Register
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);

  return (
    <section className="ovia-auth-split">
      {/* ─── Left Visual Half ─── */}
      <div className="ovia-auth-visual" aria-hidden="true">
        <div className="ovia-auth-visual-top">
          <span className="ovia-auth-visual-brand">OVIA</span>
          <span className="ovia-auth-visual-tagline">TRAVEL FURTHER</span>
        </div>
        <div className="ovia-auth-visual-bottom">
          <span className="ovia-auth-visual-hero-heading">ICONIC DESIGN</span>
          <span className="ovia-auth-visual-hero-sub">FOR WHAT&apos;S NEXT</span>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="ovia-auth-panel">
        <div className="ovia-auth-card">
          {/* Top Header Bar */}
          <div className="ovia-auth-header">
            {mode !== "sign-in" ? (
              <button
                type="button"
                className="ovia-auth-back-btn"
                aria-label="Back"
                onClick={() => {
                  if (mode === "password-step2") navigateTo("password-step1");
                  else if (mode === "password-step3") navigateTo("password-step2");
                  else navigateTo("sign-in");
                }}
              >
                <ChevronLeft size={22} />
              </button>
            ) : (
              <div className="ovia-auth-header-spacer" />
            )}

            <Link href="/" className="ovia-auth-logo" aria-label="OVIA Home">
              OVIA
            </Link>

            <div className="ovia-auth-header-spacer" />
          </div>

          {/* Step Indicators for Password Assistance */}
          {mode === "password-step1" && (
            <p className="ovia-auth-step-indicator">STEP 1 OF 3</p>
          )}
          {mode === "password-step2" && (
            <p className="ovia-auth-step-indicator">STEP 2 OF 3</p>
          )}
          {mode === "password-step3" && (
            <p className="ovia-auth-step-indicator">STEP 3 OF 3</p>
          )}

          {/* ══════════════════════════════════════════════
              VIEW 1: SIGN IN TO YOUR ACCOUNT
             ══════════════════════════════════════════════ */}
          {mode === "sign-in" && (
            <div className="ovia-auth-view">
              <h1 className="ovia-auth-heading">Sign in to your account</h1>
              <p className="ovia-auth-subtext">
                Access your OVIA account to manage your orders, wishlist and
                personal details.
              </p>

              {successMsg && (
                <div className="ovia-auth-success" role="status">
                  {successMsg}
                </div>
              )}

              {error && (
                <div className="ovia-auth-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="ovia-auth-form">
                <div className="ovia-auth-field">
                  <label htmlFor="signin-email">Email address</label>
                  <input
                    id="signin-email"
                    type="email"
                    required
                    maxLength={200}
                    autoComplete="email"
                    placeholder="adsh@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ovia-auth-input"
                  />
                </div>

                <div className="ovia-auth-field">
                  <label htmlFor="signin-password">Password</label>
                  <div className="ovia-auth-input-wrapper">
                    <input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ovia-auth-input"
                    />
                    <button
                      type="button"
                      className="ovia-auth-eye-btn"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="ovia-auth-forgot-wrap">
                  <button
                    type="button"
                    className="ovia-auth-forgot-link"
                    onClick={() => navigateTo("password-step1")}
                  >
                    Forgot your password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="ovia-auth-primary-btn"
                >
                  {busy ? "Signing in…" : "SIGN IN →"}
                </button>
              </form>

              {/* Benefits Section */}
              <div className="ovia-auth-benefits">
                <h2 className="ovia-auth-benefits-title">Don&apos;t have an account?</h2>
                <p className="ovia-auth-benefits-sub">
                  Join OVIA for a seamless shopping experience.
                </p>

                <ul className="ovia-auth-checklist">
                  <li>
                    <Check size={14} className="ovia-auth-check-icon" />
                    <span>View and track your orders</span>
                  </li>
                  <li>
                    <Check size={14} className="ovia-auth-check-icon" />
                    <span>Save your delivery addresses</span>
                  </li>
                  <li>
                    <Check size={14} className="ovia-auth-check-icon" />
                    <span>Personalise your experience</span>
                  </li>
                  <li>
                    <Check size={14} className="ovia-auth-check-icon" />
                    <span>Get exclusive updates</span>
                  </li>
                </ul>

                <button
                  type="button"
                  className="ovia-auth-secondary-btn"
                  onClick={() => navigateTo("register")}
                >
                  CREATE ACCOUNT
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW 2: PASSWORD ASSISTANCE (STEP 1 OF 3)
             ══════════════════════════════════════════════ */}
          {mode === "password-step1" && (
            <div className="ovia-auth-view">
              <h1 className="ovia-auth-heading">Password assistance</h1>
              <p className="ovia-auth-subtext">
                Enter the email address associated with your OVIA account and
                we&apos;ll send you a verification code.
              </p>

              {error && (
                <div className="ovia-auth-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendCode} className="ovia-auth-form">
                <div className="ovia-auth-field">
                  <label htmlFor="recovery-email">Email address</label>
                  <div className="ovia-auth-input-wrapper">
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      autoComplete="email"
                      maxLength={200}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="adsh@gmail.com"
                      className="ovia-auth-input"
                    />
                    <span className="ovia-auth-input-icon" aria-hidden="true">
                      <Mail size={16} />
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="ovia-auth-primary-btn"
                >
                  {busy ? "Sending code…" : "SEND VERIFICATION CODE →"}
                </button>
              </form>

              <div className="ovia-auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="ovia-auth-secondary-btn"
                onClick={() => navigateTo("sign-in")}
              >
                Return to sign in
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW 3: ENTER VERIFICATION CODE (STEP 2 OF 3)
             ══════════════════════════════════════════════ */}
          {mode === "password-step2" && (
            <div className="ovia-auth-view">
              <h1 className="ovia-auth-heading">Enter verification code</h1>
              <p className="ovia-auth-subtext">
                We&apos;ve sent a 6-digit code to
                <br />
                <strong className="ovia-auth-bold-email">{email}</strong>
              </p>

              {error && (
                <div className="ovia-auth-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="ovia-auth-form">
                <div
                  className="ovia-auth-otp-row"
                  role="group"
                  aria-label="6-digit verification code"
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]"
                      maxLength={1}
                      autoFocus={idx === 0}
                      disabled={busy}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="ovia-auth-otp-box"
                      aria-label={`Digit ${idx + 1}`}
                    />
                  ))}
                </div>

                {attemptsLeft !== null && (
                  <p
                    className={`ovia-auth-attempts ${
                      attemptsLeft === 0 ? "ovia-auth-attempts--locked" : ""
                    }`}
                  >
                    {attemptsLeft === 0
                      ? "Account locked. Please request a new code."
                      : `${attemptsLeft} of 5 attempts remaining`}
                  </p>
                )}

                <div className="ovia-auth-resend-prompt">
                  <span>Didn&apos;t receive the code? </span>
                  {seconds > 0 ? (
                    <span className="ovia-auth-timer">
                      Resend code ({formatTimer(seconds)})
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      className="ovia-auth-resend-btn"
                      onClick={() => handleSendCode()}
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={busy || otpDigits.join("").length < 6}
                  className="ovia-auth-primary-btn"
                >
                  {busy ? "Verifying…" : "VERIFY CODE →"}
                </button>
              </form>

              <div className="ovia-auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="ovia-auth-secondary-btn"
                onClick={() => navigateTo("sign-in")}
              >
                Return to sign in
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW 4: RESET YOUR PASSWORD (STEP 3 OF 3)
             ══════════════════════════════════════════════ */}
          {mode === "password-step3" && (
            <div className="ovia-auth-view">
              <h1 className="ovia-auth-heading">Reset your password</h1>
              <p className="ovia-auth-subtext">
                Create a new password for your OVIA account.
              </p>

              {error && (
                <div className="ovia-auth-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="ovia-auth-form">
                <div className="ovia-auth-field">
                  <label htmlFor="new-password">New password</label>
                  <div className="ovia-auth-input-wrapper">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ovia-auth-input"
                    />
                    <button
                      type="button"
                      className="ovia-auth-eye-btn"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <ul className="ovia-auth-checklist ovia-auth-req-list">
                  <li className={hasMinLength ? "is-valid" : ""}>
                    <Check size={14} className="ovia-auth-check-icon" />
                    <span>At least 8 characters</span>
                  </li>
                  <li className={hasNumber ? "is-valid" : ""}>
                    <Check size={14} className="ovia-auth-check-icon" />
                    <span>Includes a number</span>
                  </li>
                  <li className={hasUppercase ? "is-valid" : ""}>
                    <Check size={14} className="ovia-auth-check-icon" />
                    <span>Includes an uppercase letter</span>
                  </li>
                </ul>

                <div className="ovia-auth-field">
                  <label htmlFor="confirm-new-password">Confirm new password</label>
                  <div className="ovia-auth-input-wrapper">
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="ovia-auth-input"
                    />
                    <button
                      type="button"
                      className="ovia-auth-eye-btn"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="ovia-auth-primary-btn"
                >
                  {busy ? "Updating…" : "RESET PASSWORD →"}
                </button>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW 5: CREATE ACCOUNT (REGISTER)
             ══════════════════════════════════════════════ */}
          {mode === "register" && (
            <div className="ovia-auth-view">
              <h1 className="ovia-auth-heading">Create your OVIA account</h1>
              <p className="ovia-auth-subtext">
                Join OVIA for an exceptional travel and seamless shopping experience.
              </p>

              {error && (
                <div className="ovia-auth-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="ovia-auth-form">
                <div className="ovia-auth-name-row">
                  <div className="ovia-auth-field">
                    <label htmlFor="first-name">First name *</label>
                    <input
                      id="first-name"
                      type="text"
                      required
                      maxLength={50}
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="ovia-auth-input"
                    />
                  </div>
                  <div className="ovia-auth-field">
                    <label htmlFor="last-name">Last name *</label>
                    <input
                      id="last-name"
                      type="text"
                      required
                      maxLength={49}
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="ovia-auth-input"
                    />
                  </div>
                </div>

                <div className="ovia-auth-field">
                  <label htmlFor="reg-email">Email address *</label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    maxLength={200}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ovia-auth-input"
                  />
                </div>

                <div className="ovia-auth-field">
                  <label htmlFor="reg-password">Password *</label>
                  <div className="ovia-auth-input-wrapper">
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ovia-auth-input"
                    />
                    <button
                      type="button"
                      className="ovia-auth-eye-btn"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <ul className="ovia-auth-checklist ovia-auth-req-list">
                  <li className={hasMinLength ? "is-valid" : ""}>
                    <Check size={14} className="ovia-auth-check-icon" />
                    <span>At least 8 characters</span>
                  </li>
                  <li className={hasNumber ? "is-valid" : ""}>
                    <Check size={14} className="ovia-auth-check-icon" />
                    <span>Includes a number</span>
                  </li>
                  <li className={hasUppercase ? "is-valid" : ""}>
                    <Check size={14} className="ovia-auth-check-icon" />
                    <span>Includes an uppercase letter</span>
                  </li>
                </ul>

                <div className="ovia-auth-field">
                  <label htmlFor="reg-confirm-password">Confirm password *</label>
                  <div className="ovia-auth-input-wrapper">
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="ovia-auth-input"
                    />
                    <button
                      type="button"
                      className="ovia-auth-eye-btn"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                <label className="ovia-auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                  />
                  <span>
                    I accept the <Link href="/terms">Terms</Link> and have read the{" "}
                    <Link href="/privacy">Privacy Policy</Link>.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="ovia-auth-primary-btn"
                >
                  {busy ? "Creating account…" : "CREATE ACCOUNT →"}
                </button>
              </form>

              <div className="ovia-auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="ovia-auth-secondary-btn"
                onClick={() => navigateTo("sign-in")}
              >
                Already have an account? Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
