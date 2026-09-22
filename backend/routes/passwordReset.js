const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { sendPasswordResetEmail } = require('../utils/mailer');

const router = express.Router();
const prisma = new PrismaClient();

const CODE_TTL_MS = 10 * 60 * 1000; // verification code expires after 10 minutes
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // short-lived reset authorization token
const MAX_ATTEMPTS = 5; // maximum verification attempts per reset request
const RESEND_COOLDOWN_MS = 60 * 1000; // resend cooldown

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MESSAGE = "If an account exists for this email, a verification code has been sent.";

// In-memory cooldown used for ALL emails (existing or not) so request timing
// and responses never reveal whether an account exists.
const forgotPasswordCooldown = new Map();

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generateVerificationCode() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function pruneCooldown() {
  if (forgotPasswordCooldown.size <= 10000) return;
  const now = Date.now();
  for (const [key, ts] of forgotPasswordCooldown.entries()) {
    if (now - ts > RESEND_COOLDOWN_MS) forgotPasswordCooldown.delete(key);
  }
}

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  // Generic resend cooldown for every requested email address.
  const now = Date.now();
  const lastRequest = forgotPasswordCooldown.get(email);
  if (lastRequest && now - lastRequest < RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: 'Please wait a moment before requesting another verification code.' });
  }
  forgotPasswordCooldown.set(email, now);
  pruneCooldown();

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Never reveal whether the account exists.
    if (!user) {
      return res.json({ message: GENERIC_MESSAGE });
    }

    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(now + CODE_TTL_MS);

    // Invalidate any previous active reset code for this user.
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date(now) }
    });

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        email,
        codeHash,
        expiresAt,
        attempts: 0
      }
    });

    try {
      await sendPasswordResetEmail({ to: email, code });
    } catch (err) {
      // SMTP failures must never expose credentials or whether an account exists.
      console.error('[PASSWORD-RESET] SMTP dispatch failed. No code or credentials logged.');
    }

    return res.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('[PASSWORD-RESET] forgot-password error:', error.message);
    return res.status(500).json({ error: 'An internal error occurred. Please try again later.' });
  }
});

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || '').trim();

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    const reset = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!reset) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    // A code that has already produced a reset token cannot be reused.
    if (reset.verifiedAt && reset.resetTokenHash) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    if (reset.attempts >= MAX_ATTEMPTS) {
      await prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() }
      });
      return res.status(429).json({ error: 'Too many verification attempts. Please request a new code.' });
    }

    const isValid = await bcrypt.compare(code, reset.codeHash);

    if (!isValid) {
      const attempts = reset.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await prisma.passwordReset.update({
          where: { id: reset.id },
          data: { attempts, usedAt: new Date() }
        });
        return res.status(429).json({ error: 'Too many verification attempts. Please request a new code.' });
      }
      await prisma.passwordReset.update({
        where: { id: reset.id },
        data: { attempts }
      });
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    const resetToken = generateResetToken();
    const resetTokenHash = sha256Hex(resetToken);
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: {
        verifiedAt: new Date(),
        resetTokenHash,
        resetTokenExpiresAt
      }
    });

    return res.json({ verified: true, resetToken });
  } catch (error) {
    console.error('[PASSWORD-RESET] verify-reset-code error:', error.message);
    return res.status(500).json({ error: 'An internal error occurred. Please try again later.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const resetToken = String(req.body.resetToken || '').trim();
  const newPassword = String(req.body.newPassword || '');

  if (!resetToken) {
    return res.status(400).json({ error: 'Your password reset session has expired. Please start again.' });
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    const resetTokenHash = sha256Hex(resetToken);

    const reset = await prisma.passwordReset.findFirst({
      where: {
        resetTokenHash,
        usedAt: null,
        verifiedAt: { not: null },
        resetTokenExpiresAt: { gt: new Date() }
      }
    });

    if (!reset) {
      return res.status(400).json({ error: 'Your password reset session has expired. Please start again.' });
    }

    const user = await prisma.user.findUnique({ where: { id: reset.userId } });
    if (!user) {
      return res.status(400).json({ error: 'Your password reset session has expired. Please start again.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date(), resetTokenHash: null }
      }),
      prisma.passwordReset.updateMany({
        where: { userId: user.id, id: { not: reset.id }, usedAt: null },
        data: { usedAt: new Date() }
      })
    ]);

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('[PASSWORD-RESET] reset-password error:', error.message);
    return res.status(500).json({ error: 'An internal error occurred. Please try again later.' });
  }
});

module.exports = router;