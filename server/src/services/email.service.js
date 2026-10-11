import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { smtp } = env;
  if (!smtp.user || !smtp.password) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: smtp.server || 'smtp.gmail.com',
    port: smtp.port || 587,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return cachedTransporter;
}

/**
 * Brevo HTTP REST Fallback:
 * Sends email via Brevo REST API (port 443) if SMTP port is blocked by firewall/ISP
 */
async function sendViaBrevo({ to, subject, htmlContent }) {
  if (!env.brevoApiKey) return false;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': env.brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'PeoplePay HRMS', email: env.smtp.user || 'no-reply@peoplepay.internal' },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (response.ok) {
      console.log(`[Email Service] Delivered email to ${to} via Brevo API`);
      return true;
    }
    const errText = await response.text();
    console.warn(`[Email Service] Brevo API returned status ${response.status}:`, errText);
  } catch (err) {
    console.error(`[Email Service] Brevo API fallback error:`, err.message);
  }
  return false;
}

/**
 * Core dispatch function with automated failover:
 * 1. Primary: Direct Gmail SMTP
 * 2. Secondary: Brevo HTTPS API
 * 3. Fallback: Console output
 */
export async function sendEmail({ to, subject, html, text }) {
  const recipient = (to || '').trim();
  if (!recipient) return { success: false, reason: 'Recipient email is missing' };

  console.log(`[Email Service] Dispatching "${subject}" to ${recipient}`);

  // 1. Try Gmail SMTP
  const transporter = getTransporter();
  if (transporter && env.smtp.user) {
    try {
      const info = await transporter.sendMail({
        from: `"PeoplePay HRMS" <${env.smtp.user}>`,
        to: recipient,
        subject,
        text: text || subject,
        html,
      });
      console.log(`[Email Service] Delivered via SMTP to ${recipient} (MessageId: ${info.messageId})`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (smtpErr) {
      console.warn(`[Email Service] SMTP dispatch failed (${smtpErr.message}). Attempting Brevo API fallback...`);
    }
  }

  // 2. Try Brevo API Fallback
  if (env.brevoApiKey) {
    const brevoOk = await sendViaBrevo({ to: recipient, subject, htmlContent: html });
    if (brevoOk) {
      return { success: true, provider: 'brevo' };
    }
  }

  // 3. Dev Fallback: Server Console
  console.log(`\n=============================================================`);
  console.log(`[EMAIL NOTICE - CONSOLE DELIVERY]`);
  console.log(`To      : ${recipient}`);
  console.log(`Subject : ${subject}`);
  console.log(`Content : ${text || 'View HTML content'}`);
  console.log(`=============================================================\n`);

  return { success: true, provider: 'console_dev' };
}

/**
 * 1. Registration Email OTP Verification Template
 */
export async function sendOtpEmail(to, otp, name = 'Team Member') {
  const subject = `Your PeoplePay Verification Code: ${otp}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .body { padding: 32px 28px; }
        .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 style="margin: 0; font-size: 20px;">PeoplePay Enterprise HRMS</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Corporate Identity & Access Management</p>
        </div>
        <div class="body">
          <p style="font-size: 15px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">
            Thank you for registering on PeoplePay. To activate your corporate profile and proceed with employee onboarding, please use the following single-use verification code:
          </p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Valid for 15 minutes &bull; Single-use only</div>
          </div>
          <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 0;">
            After email verification, your account will be placed in Administrator review for official role and department assignment. If you did not request this, please ignore this email.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PeoplePay Technologies Inc. &bull; Enterprise SOC 2 Type II Certified
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Your PeoplePay verification code is: ${otp}. Valid for 15 minutes.`,
  });
}

/**
 * 2. Account Approved & Activated Template
 */
export async function sendApprovalEmail(to, name, roleName = 'Employee') {
  const subject = `Welcome to PeoplePay — Your Account Has Been Approved!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .body { padding: 32px 28px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #dcfce7; color: #15803d; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
        .btn { display: inline-block; padding: 12px 28px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 style="margin: 0; font-size: 20px;">PeoplePay Enterprise HRMS</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Workforce Onboarding Complete</p>
        </div>
        <div class="body" style="text-align: center;">
          <div class="badge">&#10003; Account Activated</div>
          <h3 style="margin: 0 0 12px; color: #0f172a;">Welcome to the Team, ${name}!</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; text-align: left;">
            An Organization Administrator has reviewed your verified credentials and completed your official onboarding. You have been granted access as <strong>${roleName}</strong>.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: left; margin: 20px 0; font-size: 13px;">
            <div><strong>Access Portal:</strong> Full Employee Self-Service</div>
            <div><strong>Assigned Role:</strong> ${roleName}</div>
            <div><strong>Enabled Modules:</strong> Attendance, Leaves, Payslips, Documents</div>
          </div>
          <a href="${env.clientUrl}/login" class="btn">Sign In to PeoplePay Workplace</a>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PeoplePay Technologies Inc. &bull; Enterprise Grade Security
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Your PeoplePay account has been approved and activated! Role: ${roleName}. Sign in at ${env.clientUrl}/login`,
  });
}

/**
 * 3. Password Reset OTP Template
 */
export async function sendPasswordResetEmail(to, otp, name = 'User') {
  const subject = `Your PeoplePay Password Reset Code: ${otp}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .body { padding: 32px 28px; }
        .otp-box { background: #fef2f2; border: 2px dashed #fca5a5; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #dc2626; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 style="margin: 0; font-size: 20px;">PeoplePay Security Services</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Password Recovery Request</p>
        </div>
        <div class="body">
          <p style="font-size: 15px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">
            We received a request to reset your PeoplePay account password. Enter the code below to authorize the password update:
          </p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div style="font-size: 12px; color: #991b1b; margin-top: 6px;">Valid for 1 hour &bull; Do not share with anyone</div>
          </div>
          <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 0;">
            If you did not initiate this password reset, please contact your Organization Security Administrator immediately.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PeoplePay Technologies Inc. &bull; Enterprise Grade Security
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Your PeoplePay password reset code is: ${otp}. Valid for 1 hour.`,
  });
}
