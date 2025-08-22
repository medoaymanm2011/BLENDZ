import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const presetService = process.env.SMTP_SERVICE; // e.g. 'gmail', 'hotmail', 'yahoo'
const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || '';
const fromName = process.env.FROM_NAME || 'Blendz Store';

let transporter: any | null = null;

function inferServiceFromEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'gmail';
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') return 'hotmail';
  if (domain === 'yahoo.com' || domain === 'yahoo.com.eg') return 'yahoo';
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') return 'icloud';
  return null;
}

function getTransporter(): any | null {
  if (transporter) return transporter;
  if (!user || !pass) { try { console.warn('[Email] Disabled: missing SMTP_USER or SMTP_PASS'); } catch {} return null; }

  // Prefer explicit host/port if provided
  if (host && port) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for others
      auth: { user, pass },
    });
    return transporter;
  }

  // Else, use service by env or infer from email domain (requires only user/pass)
  const service = presetService || inferServiceFromEmail(user);
  if (service) {
    transporter = nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
    return transporter;
  }

  // As a last resort, cannot configure
  try { console.warn('[Email] Disabled: no SMTP_HOST/PORT and could not infer SMTP_SERVICE from email domain. Set SMTP_SERVICE or provide host/port.'); } catch {}
  return null;
}

export async function sendVerificationEmail(to: string, code: string, locale: string = 'en') {
  const t = getTransporter();
  const subject = locale === 'ar' ? 'كود تفعيل البريد الإلكتروني' : 'Your Email Verification Code';
  const preheader = locale === 'ar' ? 'استخدم هذا الكود لتأكيد بريدك' : 'Use this code to verify your email';
  const heading = locale === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Verify your email';
  const intro = locale === 'ar' ? 'شكرًا للتسجيل في متجر Blendz.' : 'Thanks for signing up to Blendz store.';
  const instruction = locale === 'ar' ? 'استخدم رمز التحقق التالي لإكمال عملية التفعيل:' : 'Use the verification code below to complete verification:';
  const note = locale === 'ar' ? 'ينتهي صلاحية الكود خلال 10 دقائق.' : 'This code expires in 10 minutes.';

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a">
    <span style="display:none;visibility:hidden;opacity:0;height:0;width:0">${preheader}</span>
    <div style="max-width:560px;margin:24px auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h1 style="margin:0 0 8px;color:#1f2937;font-size:22px">${heading}</h1>
      <p style="margin:0 0 12px;color:#374151">${intro}</p>
      <p style="margin:0 0 8px;color:#374151">${instruction}</p>
      <div style="font-size:28px;letter-spacing:6px;font-weight:700;background:#f9fafb;border:1px dashed #cbd5e1;border-radius:10px;padding:16px;text-align:center;color:#111827">${code}</div>
      <p style="margin:12px 0 0;color:#6b7280">${note}</p>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px">© ${new Date().getFullYear()} Blendz</p>
  </div>`;

  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  if (!t) {
    // Fallback to console log in development if SMTP not configured
    try { console.log('[Email disabled] Verification code:', code, 'to', to); } catch {}
    return { ok: false, skipped: true } as const;
  }

  await t.sendMail({
    from,
    to,
    subject,
    html,
  });
  return { ok: true } as const;
}
