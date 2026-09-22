require('dotenv').config();
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Sends a fanned-out SMS to the hardcoded demo numbers
 * @param {string} subject - Alert subject/title
 * @param {string} text - Plain text body
 */
async function sendFanOutEmail(subject, text) {
  // We keep the function name `sendFanOutEmail` to avoid breaking existing imports, 
  // but it now acts as an SMS dispatcher.
  const phoneNumbers = [process.env.DEMO_PHONE_1, process.env.DEMO_PHONE_2].filter(Boolean);

  if (phoneNumbers.length === 0) {
    console.warn("⚠️ No DEMO_PHONE numbers found in .env. SMS dispatch skipped.");
    return;
  }

  if (!twilioClient) {
    console.warn("⚠️ Twilio credentials missing in .env. SMS dispatch skipped.");
    return;
  }

  try {
    // Truncate text if it's too long
    const messageBody = `${subject}\n\n${text}`.substring(0, 1500);

    const promises = phoneNumbers.map(phone => {
      // Ensure we use the whatsapp: prefix for the sandbox
      const toStr = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
      const fromStr = twilioPhoneNumber.startsWith('whatsapp:') ? twilioPhoneNumber : `whatsapp:${twilioPhoneNumber}`;

      return twilioClient.messages.create({
        body: messageBody,
        from: fromStr,
        to: toStr
      });
    });

    const results = await Promise.all(promises);

    console.log(`📱 WhatsApp messages successfully sent to: ${phoneNumbers.join(', ')}`);
    results.forEach(res => console.log(`📱 Message SID: ${res.sid}`));

    return results;
  } catch (error) {
    console.error("❌ Failed to send WhatsApp message via Twilio:", error);
    // Don't throw, just swallow the error so it doesn't crash the server
  }
}

function buildSmtpTransporter() {
  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!hasSmtpConfig) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    family: 4,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Sends the password reset verification code via the same SMTP gateway
 * already used by ApniLeap. Never logs the code itself.
 * @param {object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.code - 6-digit verification code
 */
async function sendPasswordResetEmail({ to, code, expiresInMinutes = 10 }) {
  const transporter = buildSmtpTransporter();
  if (!transporter) {
    console.warn("⚠️ SMTP credentials missing in .env. Password reset email skipped.");
    return { skipped: true };
  }

  const fromName = process.env.SMTP_FROM_NAME || "ApniLeap";
  const redirectTo = process.env.SMTP_REDIRECT_TO || null;
  const finalTo = redirectTo && redirectTo !== to ? `${to}, ${redirectTo}` : to;

  const mailOptions = {
    from: `"${fromName}" <${process.env.SMTP_USER}>`,
    to: finalTo,
    subject: "APNILEAP Password Reset Verification",
    text: [
      "Your verification code is: " + code,
      "",
      "This code expires in " + expiresInMinutes + " minutes.",
      "",
      "If you did not request this password reset, ignore this email."
    ].join("\n"),
    html: `
<div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; max-width: 600px; margin: 0 auto; color: #24292f; background-color: #ffffff; padding: 20px;">
    <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="font-size: 24px; font-weight: 400; margin-bottom: 8px;">APNILEAP</h2>
        <p style="font-size: 14px; color: #57606a; margin: 0;">Password Reset Verification</p>
    </div>
    <div style="border: 1px solid #d0d7de; border-radius: 6px; padding: 32px; background-color: #f6f8fa;">
        <p style="font-size: 14px; margin-top: 0; margin-bottom: 16px;">Your verification code is:</p>
        <div style="font-size: 32px; font-weight: 600; text-align: center; letter-spacing: 6px; margin-bottom: 16px;">
            ${code}
        </div>
        <p style="font-size: 12px; color: #57606a; margin-bottom: 16px;">This code expires in ${expiresInMinutes} minutes.</p>
        <p style="font-size: 12px; color: #57606a; margin-bottom: 0;">If you did not request this password reset, ignore this email.</p>
    </div>
    <div style="margin-top: 24px; text-align: center;">
        <p style="font-size: 11px; color: #57606a; margin-bottom: 0;">You're receiving this email because a password reset was requested for your ApniLeap account (${to}).</p>
    </div>
</div>
`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[PASSWORD-RESET] Verification email dispatched to ${to}${redirectTo && redirectTo !== to ? " (with redirect)" : ""}`);
    return info;
  } catch (error) {
    console.error("❌ Failed to dispatch password reset email (recipient suppressed):", error.code || error.message);
    throw error;
  }
}

module.exports = {
  sendFanOutEmail,
  sendPasswordResetEmail
};
