import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

let transporter: nodemailer.Transporter;

/**
 * Build transporter
 */
function buildTransport() {
  // if no SMTP host, fallback to console (so dev doesn’t crash)
  if (!SMTP_HOST) {
    return {
      sendMail: async (opts: any) => {
        console.log('📧 [DEV console email]\nFrom:', opts.from, '\nTo:', opts.to,
          '\nSubject:', opts.subject, '\nHTML:\n', opts.html);
        return { messageId: 'console-dev' };
      },
    } as any;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: (String(SMTP_SECURE || 'false') === 'true'),
    auth: (SMTP_USER && SMTP_PASS) ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) transporter = buildTransport();
  const from = MAIL_FROM || 'Ignite <noreply@ignite.local>';
  const info = await transporter.sendMail({ from, to, subject, html });
  return info;
}
