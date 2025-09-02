export function renderSignupOtpEmail(fullName: string, otp: string) {
  const safeName = fullName || 'there';
  return `
  <div style="font-family: system-ui, Arial, sans-serif; max-width: 520px;">
    <h2>Verify your email</h2>
    <p>Hi ${safeName},</p>
    <p>Your one-time verification code is:</p>
    <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 12px 0;">
      ${otp}
    </div>
    <p>This code expires in 10 minutes. If you didn’t request this, you can ignore the email.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
    <p style="color:#777;font-size:12px;">Sent by Ignite • noreply</p>
  </div>`;
}
