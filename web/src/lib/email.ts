import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendWelcomeEmail(
  to: string, 
  name: string, 
  handle: string, 
  tempPassword: string, 
  role: string
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set. Falling back to console logging.");
    console.log(`[EMAIL MOCK] To: ${to} | Password: ${tempPassword}`);
    return;
  }

  const loginUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://joel-os.vercel.app';

  try {
    await resend.emails.send({
      from: 'Joel Academy <admin@joelacademy.org>', // Replace with verified domain
      to,
      subject: 'Welcome to Joel Academy - Your Credentials inside',
      html: `
        <div style="font-family: sans-serif; max-w-xl; margin: 0 auto; color: #191919;">
          <h1 style="font-size: 24px; border-bottom: 1px solid #eaeaea; padding-bottom: 16px;">Welcome to Joel Academy, ${name}</h1>
          <p>Your account has been provisioned as a <strong>${role}</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Your login details:</p>
            <p style="margin: 0 0 4px 0;"><strong>Email:</strong> ${to}</p>
            <p style="margin: 0 0 4px 0;"><strong>Handle:</strong> @${handle}</p>
            <p style="margin: 0 0 0 0;"><strong>Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
          </div>

          <p>Please log in immediately and review your initial tasks.</p>
          
          <a href="${loginUrl}/login" style="display: inline-block; background-color: #191919; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">
            Log in to Joel Academy
          </a>
          
          <p style="margin-top: 32px; font-size: 12px; color: #888;">
            For security, do not share this email. If you did not expect this, please ignore it.
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error("Failed to send welcome email via Resend", error);
  }
}
