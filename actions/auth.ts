"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import { Resend } from "resend";

import { sql } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { createInvite, verifyInviteToken } from "@/lib/auth/invite";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return new TextEncoder().encode(secret);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function getClientMeta() {
  const headerStore = await headers();
  return {
    ipAddress:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      "unknown",
    userAgent: headerStore.get("user-agent") ?? "unknown",
  };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(_prev: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  try {
    const rows = await sql`
      SELECT id, org_id, password_hash, role, first_name, last_name, is_active
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return { success: false, error: "Invalid email or password." };
    }

    const user = rows[0];

    if (!user.is_active) {
      return {
        success: false,
        error: "Your account has been deactivated. Contact your administrator.",
      };
    }

    if (!user.password_hash) {
      return {
        success: false,
        error: "Account setup not complete. Please check your invite email.",
      };
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: "Invalid email or password." };
    }

    const meta = await getClientMeta();
    await createSession(
      { id: user.id, orgId: user.org_id, role: user.role },
      meta
    );

    // Audit log
    await sql`
      INSERT INTO activity_logs (org_id, user_id, action, metadata, ip_address)
      VALUES (${user.org_id}, ${user.id}, 'login', ${JSON.stringify({ email })}, ${meta.ipAddress})
    `;

    return { success: true };
  } catch (err: any) {
    console.error("[loginAction]", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPasswordAction(_prev: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Email is required." };
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return { success: false, error: "Invalid email address." };
  }

  // Always return success to prevent user enumeration
  const genericSuccess = {
    success: true,
    message: "If that email is registered, you'll receive a reset link shortly.",
  };

  try {
    const rows = await sql`
      SELECT id, org_id, first_name FROM users
      WHERE email = ${email} AND is_active = TRUE
      LIMIT 1
    `;

    if (rows.length === 0) return genericSuccess;

    const user = rows[0];
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Sign reset token
    const token = await new SignJWT({ type: "password_reset", userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(getJWTSecret());

    const tokenHash = hashToken(token);

    // Invalidate any existing reset tokens for this user
    await sql`
      UPDATE password_reset_tokens SET used_at = NOW()
      WHERE user_id = ${user.id} AND used_at IS NULL
    `;

    // Store new reset token
    await sql`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${user.id}, ${tokenHash}, ${expiresAt.toISOString()})
    `;

    // Send reset email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@bondsmaster.com",
      to: email,
      subject: "Reset your BondsMaster password",
      html: buildResetEmail(resetUrl, user.first_name || "there"),
    });

    // Audit log
    await sql`
      INSERT INTO activity_logs (org_id, user_id, action, metadata)
      VALUES (${user.org_id}, ${user.id}, 'password_reset_requested', ${JSON.stringify({ email })})
    `;

    return genericSuccess;
  } catch (err: any) {
    console.error("[forgotPasswordAction]", err);
    return genericSuccess; // Never reveal errors on this endpoint
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPasswordAction(_prev: any, formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) return { success: false, error: "Reset token is missing." };
  if (!password || !confirmPassword)
    return { success: false, error: "Both password fields are required." };
  if (password !== confirmPassword)
    return { success: false, error: "Passwords do not match." };
  if (password.length < 8)
    return { success: false, error: "Password must be at least 8 characters." };

  try {
    // Verify JWT signature
    const { payload } = await jwtVerify<{ type: string; userId: string }>(
      token,
      getJWTSecret()
    );
    if (payload.type !== "password_reset") {
      return { success: false, error: "Invalid reset token." };
    }

    const tokenHash = hashToken(token);

    // Check token is in DB and unused
    const rows = await sql`
      SELECT prt.id, u.id AS user_id, u.org_id
      FROM password_reset_tokens prt
      JOIN users u ON u.id = prt.user_id
      WHERE prt.token_hash = ${tokenHash}
        AND prt.expires_at > NOW()
        AND prt.used_at IS NULL
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        success: false,
        error: "This reset link has expired or already been used.",
      };
    }

    const { id: tokenId, user_id, org_id } = rows[0];

    // Update password
    const newHash = await hashPassword(password);
    await sql`
      UPDATE users SET password_hash = ${newHash}, updated_at = NOW()
      WHERE id = ${user_id}
    `;

    // Invalidate token
    await sql`
      UPDATE password_reset_tokens SET used_at = NOW()
      WHERE id = ${tokenId}
    `;

    // Revoke all existing sessions (security)
    await sql`DELETE FROM sessions WHERE user_id = ${user_id}`;

    // Audit log
    await sql`
      INSERT INTO activity_logs (org_id, user_id, action)
      VALUES (${org_id}, ${user_id}, 'password_reset_completed')
    `;

    return { success: true };
  } catch (err: any) {
    console.error("[resetPasswordAction]", err);
    return { success: false, error: "Invalid or expired reset token." };
  }
}

// ─── Invite User ──────────────────────────────────────────────────────────────

export async function inviteUserAction(_prev: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = (formData.get("role") as string) ?? "agent";
  const orgId = formData.get("orgId") as string;
  const invitedByUserId = formData.get("invitedByUserId") as string;

  if (!email || !orgId || !invitedByUserId) {
    return { success: false, error: "Missing required fields." };
  }

  const result = await createInvite(email, role, orgId, invitedByUserId);

  if (result.success) {
    await sql`
      INSERT INTO activity_logs (org_id, user_id, action, metadata)
      VALUES (
        ${orgId},
        ${invitedByUserId},
        'invite_sent',
        ${JSON.stringify({ invitedEmail: email, role })}
      )
    `;
  }

  return result;
}

// ─── Accept Invite ────────────────────────────────────────────────────────────

export async function acceptInviteAction(_prev: any, formData: FormData) {
  const token = formData.get("token") as string;
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) return { success: false, error: "Invite token is missing." };
  if (!firstName || !lastName) return { success: false, error: "Name is required." };
  if (!password || !confirmPassword)
    return { success: false, error: "Both password fields are required." };
  if (password !== confirmPassword)
    return { success: false, error: "Passwords do not match." };
  if (password.length < 8)
    return { success: false, error: "Password must be at least 8 characters." };

  try {
    const invite = await verifyInviteToken(token);
    if (!invite) {
      return { success: false, error: "This invite link is invalid or has expired." };
    }

    const passwordHash = await hashPassword(password);
    const tokenHash = hashToken(token);

    // Activate user
    await sql`
      UPDATE users
      SET password_hash       = ${passwordHash},
          first_name          = ${firstName},
          last_name           = ${lastName},
          is_active           = TRUE,
          invite_token_hash   = NULL,
          invite_expires_at   = NULL,
          updated_at          = NOW()
      WHERE invite_token_hash = ${tokenHash}
        AND email             = ${invite.email}
    `;

    // Fetch the activated user for session
    const rows = await sql`
      SELECT id, org_id, role FROM users WHERE email = ${invite.email} LIMIT 1
    `;

    if (rows.length === 0) {
      return { success: false, error: "Could not activate account. Please contact support." };
    }

    const user = rows[0];
    const meta = await getClientMeta();
    await createSession({ id: user.id, orgId: user.org_id, role: user.role }, meta);

    // Audit log
    await sql`
      INSERT INTO activity_logs (org_id, user_id, action, metadata)
      VALUES (
        ${user.org_id},
        ${user.id},
        'invite_accepted',
        ${JSON.stringify({ email: invite.email })}
      )
    `;

    return { success: true };
  } catch (err: any) {
    console.error("[acceptInviteAction]", err);
    return { success: false, error: err.message ?? "Unexpected error." };
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function buildResetEmail(resetUrl: string, firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px; }
    .card { background: #ffffff; border-radius: 12px; max-width: 480px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; }
    .logo { font-size: 20px; font-weight: 700; color: #2563eb; margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
    p { color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; }
    .footer { color: #94a3b8; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🔒 BondsMaster</div>
    <h1>Reset your password</h1>
    <p>Hi ${firstName},</p>
    <p>We received a request to reset your BondsMaster password. Click the button below to set a new one. This link expires in <strong>1 hour</strong>.</p>
    <a href="${resetUrl}" class="btn">Reset Password →</a>
    <p class="footer">
      If you didn't request this, you can safely ignore this email. Your password will not change.
    </p>
  </div>
</body>
</html>
  `.trim();
}
