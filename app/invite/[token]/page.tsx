"use client";

import React, { useState, useTransition, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { acceptInviteAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];
  return (
    <div className="flex gap-3 mt-1">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1 text-[11px]">
          {c.ok ? (
            <CheckCircle className="h-3 w-3 text-emerald-500" />
          ) : (
            <XCircle className="h-3 w-3 text-muted-foreground/40" />
          )}
          <span className={c.ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function AcceptInviteForm() {
  const router = useRouter();
  const params = useParams();
  const token = decodeURIComponent(params.token as string);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);

      const result = await acceptInviteAction(null, formData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      } else {
        setServerError(result.error || "Failed to accept invite.");
      }
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center gap-4 max-w-xs"
        >
          <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold">Account Created!</h2>
          <p className="text-muted-foreground text-sm">
            Your account is ready. Taking you to the dashboard...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mt-2" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 -z-10 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 -z-10 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl" />

      <div className="w-full max-w-md flex flex-col gap-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20 w-fit">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
            BondsMaster
          </span>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-2xl bg-card p-6 md:p-8 shadow-sm flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex flex-col gap-2 text-center">
            <div className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 w-fit mx-auto">
              <Sparkles className="h-3.5 w-3.5" />
              <span>You've been invited</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Create Your Account</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Set up your name and password to activate your BondsMaster account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 flex items-start gap-2.5 overflow-hidden"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="firstName" className="text-xs font-semibold text-foreground/80">
                  First Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                    <User className="h-4 w-4" />
                  </span>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jane"
                    className="pl-9"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) setErrors((p) => ({ ...p, firstName: "" }));
                    }}
                    disabled={isPending}
                  />
                </div>
                {errors.firstName && (
                  <span className="text-xs text-destructive">{errors.firstName}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lastName" className="text-xs font-semibold text-foreground/80">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Smith"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors((p) => ({ ...p, lastName: "" }));
                  }}
                  disabled={isPending}
                />
                {errors.lastName && (
                  <span className="text-xs text-destructive">{errors.lastName}</span>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-foreground/80">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="pl-9 pr-9"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                  }}
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
              {errors.password && (
                <span className="text-xs text-destructive">{errors.password}</span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/80">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  className="pl-9 pr-9"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
                  }}
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-destructive">{errors.confirmPassword}</span>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 h-10 bg-blue-600 hover:bg-blue-500 font-medium text-white transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Activate Account →</span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <AcceptInviteForm />
    </Suspense>
  );
}
