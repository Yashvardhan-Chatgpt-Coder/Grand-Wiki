const { Resend } = require("resend");

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Optimized Cloudinary Logo URL
const LOGO_URL = "https://res.cloudinary.com/dx4jjbav2/image/upload/f_auto,q_auto,w_240,c_limit/v1784568519/Logo_v5v6fs.png";

async function sendOtpEmail(email, otp) {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL || "Grand Wiki <onboarding@resend.dev>";

  if (!resend) {
    console.warn(`[DEV] OTP for ${email}: ${otp}`);
    return { devMode: true };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 440px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #f3f4f6;">
              <img src="${LOGO_URL}" alt="Grand Wiki Logo" width="160" style="display: block; max-width: 160px; height: auto; outline: none; border: 0;" />
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; text-align: center;">
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.2px;">Verify your email address</h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #4b5563;">
                Please enter the 6-digit verification code below to complete your Grand Wiki registration:
              </p>

              <!-- OTP Code Display Box -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 24px; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; color: #000000; letter-spacing: 8px; display: inline-block;">${otp}</span>
              </div>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9ca3af;">
                This code is valid for <strong>10 minutes</strong>. If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 16px 32px; background-color: #fafafa; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 11px; font-weight: 500; color: #9ca3af; tracking: 0.5px;">
                &copy; Grand Wiki. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: `${otp} is your Grand Wiki verification code`,
    html,
  });

  if (error) {
    console.error(`[RESEND ERROR] Failed to send OTP email to ${email}:`, error);
    if (
      (error.statusCode === 422 || error.statusCode === 403) &&
      (error.message?.includes("testing email address") || error.message?.includes("not verified"))
    ) {
      throw new Error(
        "Domain verification in Resend is pending. Please click 'Verify Domain' or check DNS status in your Resend dashboard."
      );
    }
    throw new Error(error.message || "Failed to send verification code via Resend.");
  }

  console.log(`[RESEND SUCCESS] Sent OTP email to ${email}, ID: ${data?.id}`);
  return { devMode: false, data };
}

async function sendApprovalEmail(email, name) {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL || "Grand Wiki <onboarding@resend.dev>";

  if (!resend) {
    console.warn(`[DEV] Approval email for ${email} (${name || "User"})`);
    return { devMode: true };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Approved</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8f9fa;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 20px 32px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Your account has been approved</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px 32px;">
              <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                Hi ${name || "there"}, your Grand Wiki account has been approved by the administration team.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">
                You can now log in and access the full site.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: "Grand Wiki Account Approved",
    html,
  });

  if (error) {
    console.error(`[RESEND ERROR] Failed to send approval email to ${email}:`, error);
    throw new Error(error.message || "Failed to send approval email via Resend.");
  }

  console.log(`[RESEND SUCCESS] Sent approval email to ${email}, ID: ${data?.id}`);
  return { devMode: false, data };
}

async function sendRejectionEmail(email, name, reason) {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL || "Grand Wiki <onboarding@resend.dev>";

  if (!resend) {
    console.warn(`[DEV] Rejection email for ${email} (${name || "User"}): ${reason || "No reason provided"}`);
    return { devMode: true };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Rejected</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8f9fa;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 20px 32px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Your account registration was not approved</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px 32px;">
              <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                Hi ${name || "there"}, your Grand Wiki account was reviewed and not approved.
              </p>
              <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                Reason: ${reason || "No reason was provided."}
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">
                You can update your details and resubmit if needed.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: "Grand Wiki Account Rejected",
    html,
  });

  if (error) {
    console.error(`[RESEND ERROR] Failed to send rejection email to ${email}:`, error);
    throw new Error(error.message || "Failed to send rejection email via Resend.");
  }

  console.log(`[RESEND SUCCESS] Sent rejection email to ${email}, ID: ${data?.id}`);
  return { devMode: false, data };
}

module.exports = { generateOtp, sendOtpEmail, sendApprovalEmail, sendRejectionEmail };
