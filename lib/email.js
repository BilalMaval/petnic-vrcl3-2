// Email utility using Brevo API
const BREVO_API_KEY = process.env.BREVO_API_KEY;
// IMPORTANT: This email MUST be verified in your Brevo account's Senders section
// Currently verified sender: alisafyan1122@gmail.com
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'alisafyan1122@gmail.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'PETNIC STUDIO';
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://petnicstudio.com';

export async function sendEmail({ to, toName, subject, htmlContent }) {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not configured - email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 
        'api-key': BREVO_API_KEY, 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Brevo API error:', response.status, error);
      return { success: false, error: error.message || 'Email send failed' };
    }

    const result = await response.json();
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (e) {
    console.error('Email send error:', e.message);
    return { success: false, error: e.message };
  }
}

export function getWelcomeEmailHtml(name) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: linear-gradient(135deg, #F97316, #EA6C10); padding: 40px 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PETNIC STUDIO!</h1>
      </div>
      <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #1A1A2E;">Hi ${name}! 👋</p>
        <p style="color: #4A4A68; line-height: 1.6;">Your account has been created successfully. You're now part of the Petnic Studio community!</p>
        
        <div style="background: #FFF8F0; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #1A1A2E; margin-top: 0;">Here's what you can do:</h3>
          <ul style="color: #4A4A68; padding-left: 20px;">
            <li>Create custom pet portraits with AI</li>
            <li>Shop personalized pet products</li>
            <li>Download digital templates & presets</li>
            <li>Join the Pet Owner Club community</li>
          </ul>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/shop" style="background: #F97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Shopping</a>
        </p>
        
        <p style="color: #999; font-size: 14px; text-align: center;">Use code <strong style="color: #F97316;">WELCOME15</strong> for 15% off your first order!</p>
      </div>
      <div style="background: #1A1A2E; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">&copy; 2026 PETNIC STUDIO. All rights reserved.</p>
      </div>
    </div>
  `;
}

export function getPasswordResetEmailHtml(name, resetUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: linear-gradient(135deg, #F97316, #EA6C10); padding: 40px 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
      </div>
      <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #1A1A2E;">Hi ${name || 'there'},</p>
        <p style="color: #4A4A68; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
        
        <p style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}" style="background: #F97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        
        <div style="background: #FFF3CD; border-left: 4px solid #F97316; padding: 15px; margin: 25px 0;">
          <p style="color: #856404; margin: 0; font-size: 14px;">⏰ This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
        </div>
        
        <p style="color: #999; font-size: 13px;">Or copy this link: <br/><span style="color: #4A4A68; word-break: break-all;">${resetUrl}</span></p>
      </div>
      <div style="background: #1A1A2E; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">&copy; 2026 PETNIC STUDIO. All rights reserved.</p>
      </div>
    </div>
  `;
}

export function getEmailVerificationHtml(name, verifyUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: linear-gradient(135deg, #F97316, #EA6C10); padding: 40px 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
      </div>
      <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #1A1A2E;">Hi ${name || 'there'},</p>
        <p style="color: #4A4A68; line-height: 1.6;">Please verify your email address to complete your registration and unlock all features:</p>
        
        <p style="text-align: center; margin: 35px 0;">
          <a href="${verifyUrl}" style="background: #F97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
        </p>
        
        <p style="color: #999; font-size: 14px; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
      <div style="background: #1A1A2E; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">&copy; 2026 PETNIC STUDIO. All rights reserved.</p>
      </div>
    </div>
  `;
}

export function getOrderConfirmationHtml(order, product, customer, isDigital = false) {
  const downloadLink = isDigital && product?.download_file_url 
    ? `<p style="text-align: center; margin-top: 25px;"><a href="${product.download_file_url}" style="background: #10B981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">📥 Download Your Files</a></p>` 
    : '';

  const dropshipInfo = product?.supplier_name 
    ? `<div style="background: #EDE9FE; padding: 15px; border-radius: 8px; margin-top: 20px;"><p style="color: #7C3AED; margin: 0; font-size: 14px;"><strong>Fulfillment:</strong> Your order will be shipped directly from our partner warehouse (${product.supplier_name}). Tracking info will be sent separately.</p></div>` 
    : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: linear-gradient(135deg, #F97316, #EA6C10); padding: 40px 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Order! 🎉</h1>
      </div>
      <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #1A1A2E;">Hi ${customer?.name || 'there'},</p>
        <p style="color: #4A4A68; line-height: 1.6;">Your order has been confirmed and is ${isDigital ? 'ready for download' : 'being prepared'}!</p>
        
        <div style="background: #F9FAFB; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #1A1A2E; margin-top: 0; border-bottom: 2px solid #F97316; padding-bottom: 12px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #4A4A68;">Order ID:</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1A1A2E;">${order?.order_id}</td></tr>
            <tr><td style="padding: 8px 0; color: #4A4A68;">Product:</td><td style="padding: 8px 0; text-align: right; color: #1A1A2E;">${order?.product_name}</td></tr>
            <tr><td style="padding: 8px 0; color: #4A4A68;">Quantity:</td><td style="padding: 8px 0; text-align: right; color: #1A1A2E;">${order?.quantity}</td></tr>
            ${order?.size ? `<tr><td style="padding: 8px 0; color: #4A4A68;">Size:</td><td style="padding: 8px 0; text-align: right; color: #1A1A2E;">${order.size}</td></tr>` : ''}
            ${order?.selected_design ? `<tr><td style="padding: 8px 0; color: #4A4A68;">Style:</td><td style="padding: 8px 0; text-align: right; color: #1A1A2E;">${order.selected_design}</td></tr>` : ''}
            <tr style="border-top: 1px solid #E5E7EB;"><td style="padding: 12px 0; font-size: 18px; color: #1A1A2E;"><strong>Total:</strong></td><td style="padding: 12px 0; text-align: right; font-size: 20px; color: #F97316;"><strong>$${order?.total}</strong></td></tr>
          </table>
        </div>
        
        ${downloadLink}
        ${dropshipInfo}
        
        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">Questions? Reply to this email or visit our <a href="${APP_URL}/contact" style="color: #F97316;">Contact Page</a>.</p>
      </div>
      <div style="background: #1A1A2E; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">&copy; 2026 PETNIC STUDIO. All rights reserved.</p>
      </div>
    </div>
  `;
}
