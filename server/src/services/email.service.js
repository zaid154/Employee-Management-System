import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const { smtp } = env;
  if (!smtp.user || !smtp.password) return null;

  cachedTransporter = nodemailer.createTransport({
    host: smtp.server || 'smtp.gmail.com',
    port: smtp.port || 587,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return cachedTransporter;
}

async function sendViaBrevo({ to, subject, htmlContent }) {
  if (!env.brevoApiKey) return false;
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
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
    if (res.ok) {
      console.log(`[Email Service] Delivered email to ${to} via Brevo API`);
      return true;
    }
    console.warn(`[Email Service] Brevo API status ${res.status}:`, await res.text());
  } catch (err) {
    console.error(`[Email Service] Brevo API error:`, err.message);
  }
  return false;
}

export async function sendEmail({ to, subject, html, text }) {
  const recipient = (to || '').trim();
  if (!recipient) return { success: false, reason: 'Recipient email is missing' };

  console.log(`[Email Service] Dispatching "${subject}" to ${recipient}`);

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
      console.warn(`[Email Service] SMTP dispatch failed (${smtpErr.message}). Trying Brevo API fallback...`);
    }
  }

  if (env.brevoApiKey) {
    const brevoOk = await sendViaBrevo({ to: recipient, subject, htmlContent: html });
    if (brevoOk) return { success: true, provider: 'brevo' };
  }

  console.log(`\n=============================================================\n[EMAIL NOTICE - CONSOLE DELIVERY]\nTo      : ${recipient}\nSubject : ${subject}\nContent : ${text || 'View HTML'}\n=============================================================\n`);
  return { success: true, provider: 'console_dev' };
}

function emailLayout(subtitle, bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#1e293b}
.card{max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05)}
.header{background:#0f172a;padding:24px;text-align:center;color:#fff}
.body{padding:28px}
.otp-box{background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:8px;padding:16px;text-align:center;margin:20px 0}
.otp-code{font-family:'Courier New',monospace;font-size:32px;font-weight:800;letter-spacing:6px;color:#0284c7}
.footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px;text-align:center;font-size:12px;color:#64748b}
.btn{display:inline-block;padding:12px 24px;background:#0284c7;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;margin-top:16px}
</style></head><body>
<div class="card">
<div class="header"><h2 style="margin:0;font-size:20px">PeoplePay Enterprise HRMS</h2><p style="margin:4px 0 0;font-size:13px;color:#94a3b8">${subtitle}</p></div>
<div class="body">${bodyHtml}</div>
<div class="footer">&copy; ${new Date().getFullYear()} PeoplePay Technologies Inc. &bull; Enterprise SOC 2 Type II Certified</div>
</div></body></html>`;
}

export async function sendOtpEmail(to, otp, name = 'Team Member') {
  const html = emailLayout('Corporate Identity & Access Management', `
    <p style="font-size:15px;margin-top:0">Hello <strong>${name}</strong>,</p>
    <p style="font-size:14px;line-height:1.5;color:#475569">
      To activate your corporate profile and proceed with employee onboarding, please use this single-use verification code:
    </p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div style="font-size:12px;color:#64748b;margin-top:6px">Valid for 15 minutes &bull; Single-use only</div>
    </div>
    <p style="font-size:13px;line-height:1.5;color:#64748b;margin-bottom:0">
      After verification, your account will be reviewed by an Administrator for role and department assignment.
    </p>
  `);
  return sendEmail({ to, subject: `Your PeoplePay Verification Code: ${otp}`, html, text: `Your PeoplePay verification code is: ${otp}. Valid for 15 minutes.` });
}

export async function sendApprovalEmail(to, name, roleName = 'Employee') {
  const html = emailLayout('Workforce Onboarding Complete', `
    <div style="text-align:center">
      <div style="display:inline-block;padding:4px 12px;border-radius:20px;background:#dcfce7;color:#15803d;font-size:13px;font-weight:600;margin-bottom:16px">&#10003; Account Activated</div>
      <h3 style="margin:0 0 12px;color:#0f172a">Welcome to the Team, ${name}!</h3>
      <p style="font-size:14px;line-height:1.6;color:#475569;text-align:left">
        Your onboarding has been completed. You have been granted access as <strong>${roleName}</strong>.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:left;margin:20px 0;font-size:13px">
        <div><strong>Access Portal:</strong> Employee Self-Service</div>
        <div><strong>Assigned Role:</strong> ${roleName}</div>
        <div><strong>Enabled Modules:</strong> Attendance, Leaves, Payslips, Documents</div>
      </div>
      <a href="${env.clientUrl}/login" class="btn">Sign In to PeoplePay Workplace</a>
    </div>
  `);
  return sendEmail({ to, subject: `Welcome to PeoplePay — Your Account Has Been Approved!`, html, text: `Your PeoplePay account has been approved and activated! Role: ${roleName}. Sign in at ${env.clientUrl}/login` });
}

export async function sendPasswordResetEmail(to, otp, name = 'User') {
  const html = emailLayout('Password Recovery Request', `
    <p style="font-size:15px;margin-top:0">Hello <strong>${name}</strong>,</p>
    <p style="font-size:14px;line-height:1.5;color:#475569">
      We received a request to reset your PeoplePay account password. Enter the code below to authorize the update:
    </p>
    <div class="otp-box" style="background:#fef2f2;border-color:#fca5a5">
      <div class="otp-code" style="color:#dc2626">${otp}</div>
      <div style="font-size:12px;color:#991b1b;margin-top:6px">Valid for 1 hour &bull; Do not share with anyone</div>
    </div>
    <p style="font-size:13px;line-height:1.5;color:#64748b;margin-bottom:0">
      If you did not initiate this request, please contact your Organization Security Administrator immediately.
    </p>
  `);
  return sendEmail({ to, subject: `Your PeoplePay Password Reset Code: ${otp}`, html, text: `Your PeoplePay password reset code is: ${otp}. Valid for 1 hour.` });
}

export async function sendSalaryDisbursedEmail(to, name, { month, year, netPay, paymentReference, paymentMethod }) {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = MONTHS[month - 1] || `Month ${month}`;
  const amountStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(netPay || 0);
  const methodMap = {
    bank_transfer: 'Bank Transfer (NEFT/IMPS)',
    upi: 'UPI Transfer',
    cheque: 'Company Cheque',
    cash: 'Cash Payment',
  };
  const modeText = methodMap[paymentMethod] || 'Bank Transfer';

  const html = emailLayout(`Salary Credit &bull; ${monthName} ${year}`, `
    <div style="text-align:center">
      <div style="display:inline-block;padding:4px 12px;border-radius:20px;background:#dcfce7;color:#15803d;font-size:12px;font-weight:600;margin-bottom:14px">&#10003; Payment Confirmed</div>
      <h3 style="margin:0 0 8px;color:#0f172a">Hello ${name},</h3>
      <p style="font-size:14px;line-height:1.5;color:#475569;margin-bottom:16px">
        Your salary for <strong>${monthName} ${year}</strong> has been disbursed.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:left;margin-bottom:20px;font-size:13px">
        <div style="margin-bottom:8px"><strong>Net Disbursed:</strong> <span style="font-size:15px;color:#15803d;font-family:monospace">${amountStr}</span></div>
        <div style="margin-bottom:8px"><strong>Payment Mode:</strong> ${modeText}</div>
        <div style="margin-bottom:8px"><strong>Ref / UTR:</strong> <span style="font-family:monospace">${paymentReference || 'N/A'}</span></div>
        <div><strong>Pay Period:</strong> ${monthName} ${year}</div>
      </div>
      <a href="${env.clientUrl}/payroll" class="btn">View / Print Payslip</a>
    </div>
  `);

  return sendEmail({
    to,
    subject: `Salary Disbursed: ${monthName} ${year} (${amountStr})`,
    html,
    text: `Hello ${name}, your salary for ${monthName} ${year} (${amountStr}) has been disbursed. UTR: ${paymentReference || 'N/A'}. Log in at ${env.clientUrl}/payroll to view your statement.`,
  });
}
