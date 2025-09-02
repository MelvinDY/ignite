// tests/utils/otpMock.ts
export const sentOtps: Array<{ userId: string; email: string }> = [];
export async function issueSignupOtp(userId: string, toEmail: string, _name: string) {
  sentOtps.push({ userId, email: toEmail });
}
export function resetOtpMock() { sentOtps.length = 0; }
