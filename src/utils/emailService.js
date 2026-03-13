import nodemailer from "nodemailer";

const getEnvVars = () => {
    return {
        gmailUser: process.env.GMAIL_USER,
        gmailPass: process.env.GMAIL_PASS,
        adminEmail: process.env.ADMIN_EMAIL,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://hedoomyy.com'
    };
};

const createTransporter = () => {
  const { gmailUser, gmailPass } = getEnvVars();
  console.log(`📧 [EmailService] Initializing transporter for ${gmailUser}...`);
  
  if (!gmailUser || !gmailPass) {
    console.warn("⚠️ [EmailService] Email credentials missing in env variables (GMAIL_USER / GMAIL_PASS).");
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  return transporter;
};

const generateOrderHTML = (order, isCustomer = false, statusUpdate = false) => {
  const { id, items, totals, delivery, payment, status } = order;
  const orderId = id ? id.slice(0, 8).toUpperCase() : "UNKNOWN";
  const total = totals?.total || 0;

  let statusMessage = isCustomer ? 'Thank you for your order!' : '🎉 New Order Received';
  if (statusUpdate) {
    if (status === 'confirmed') {
      statusMessage = isCustomer ? 'Your order has been confirmed!' : `Order #${orderId} confirmed`;
    } else if (status === 'shipped') {
      statusMessage = isCustomer ? 'Your order is on its way!' : `Order #${orderId} shipped`;
    } else if (status === 'delivered') {
      statusMessage = isCustomer ? 'Your order has been delivered!' : `Order #${orderId} delivered`;
    } else if (status === 'payment_confirmed') {
      statusMessage = isCustomer ? 'Payment Confirmed! Your order is being processed.' : `Order #${orderId} payment confirmed`;
    } else if (status === 'payment_rejected') {
      statusMessage = isCustomer ? 'Payment Not Approved' : `Order #${orderId} payment rejected`;
    } else if (status === 'cancelled') {
      statusMessage = isCustomer ? 'Order Cancelled' : `Order #${orderId} cancelled`;
    }
  }

  const reasonHtml = order.message ? `
    <div style="background-color: #fff5f5; border-left: 4px solid #f56565; padding: 15px; margin-bottom: 25px;">
      <p style="margin: 0; font-size: 14px; color: #c53030; font-weight: bold;">Note from Store:</p>
      <p style="margin: 5px 0 0; font-size: 14px; color: #4a5568;">${order.message}</p>
    </div>
  ` : '';

  const headerColor = (status === 'cancelled' || status === 'payment_rejected') ? '#e53e3e' : '#1a1b23';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid ${headerColor}; }
          .header h1 { color: ${headerColor}; margin: 0; }
          .order-summary { margin: 20px 0; background: #f9f9f9; padding: 15px; border-radius: 8px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dotted #ccc; }
          .total { font-size: 1.2em; font-weight: bold; color: ${headerColor}; text-align: right; margin-top: 15px; }
          .details { margin-top: 20px; font-size: 0.9em; }
          .footer { text-align: center; margin-top: 30px; font-size: 0.8em; color: #777; }
          .btn { display: inline-block; padding: 10px 20px; background: ${headerColor}; color: #fff !important; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; background: ${(status === 'cancelled' || status === 'payment_rejected') ? '#fff5f5' : '#f3e8ff'}; color: ${headerColor}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Hedoomyy Store</h1>
            <p>${statusMessage}</p>
            <div class="status-badge">${status ? status.replace('_', ' ') : "pending"}</div>
          </div>
          
          ${reasonHtml}
          
          <div class="order-summary">
            <h3>Order ID: #${orderId}</h3>
            ${(items || []).map((i) => `
              <div class="item">
                <span>${i.title} (${i.color} / ${i.size}) x${i.qty}</span>
                <span>${i.price * i.qty} EGP</span>
              </div>
            `).join('')}
            <div class="total">Total: ${total} EGP</div>
          </div>

          <div class="details">
            <p><strong>Customer:</strong> ${delivery?.firstName || "N/A"} ${delivery?.lastName || ""}</p>
            <p><strong>Phone:</strong> ${delivery?.phone || "N/A"}</p>
            <p><strong>Address:</strong> ${delivery?.city || ""}, ${delivery?.address || ""}, Apt ${delivery?.apartment || ""}</p>
            <p><strong>Payment Method:</strong> ${payment?.method?.toUpperCase() || 'COD'}</p>
          </div>

          ${isCustomer ? `
            <div style="text-align: center;">
              <a href="${getEnvVars().baseUrl}/account" class="btn">View My Orders</a>
            </div>
          ` : `
            <div style="text-align: center;">
              <p>Check the admin dashboard for details.</p>
            </div>
          `}

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hedoomyy Store. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const sendOrderConfirmationEmail = async (order) => {
  console.log(`📧 [EmailService] sendOrderConfirmationEmail called for order: ${order.id}`);
  const { gmailUser, adminEmail } = getEnvVars();
  const transporter = createTransporter();
  if (!transporter) {
    console.error("❌ [EmailService] Aborting confirmation email: No transporter.");
    return;
  }

  // Verify connection configuration
  try {
    console.log("📧 [EmailService] Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ [EmailService] Server is ready to take our messages");
  } catch (verifyError) {
    console.error("❌ [EmailService] SMTP Verification failed:", verifyError.message);
    if (verifyError.message.includes("Invalid login")) {
        console.error("❌ [EmailService] HINT: Please ensure your GMAIL_PASS is an 'App Password' if you have 2FA enabled.");
    }
    return;
  }

  const orderId = order.id ? order.id.slice(0, 6).toUpperCase() : "NEW";
  const customerEmail = order.customer?.email;
  console.log(`📧 [EmailService] Customer Email: ${customerEmail}, Admin Email: ${adminEmail}`);

  try {
    // Send to Admin
    if (adminEmail) {
      console.log(`📧 [EmailService] Sending email to admin: ${adminEmail}`);
      await transporter.sendMail({
        from: `"Hedoomyy Admin" <${gmailUser}>`,
        to: adminEmail,
        subject: `🛒 New Order #${orderId}`,
        html: generateOrderHTML(order, false),
        text: `New order from ${order.delivery?.firstName}. Total: ${order.totals?.total} EGP.`,
      });
    }

    // Send to Customer
    if (customerEmail) {
      console.log(`📧 [EmailService] Sending email to customer: ${customerEmail}`);
      await transporter.sendMail({
        from: `"Hedoomyy Store" <${gmailUser}>`,
        to: customerEmail,
        subject: "Your Order Confirmation - Hedoomyy",
        html: generateOrderHTML(order, true),
        text: `Thank you for your order, ${order.delivery?.firstName}! Your order ID is ${order.id}.`,
      });
    }
    console.log(`✅ [EmailService] Confirmation emails process finished for order ${order.id}`);
  } catch (error) {
    console.error(`❌ [EmailService] Failed to send confirmation emails:`, error.message);
  }
};

export const sendOrderStatusUpdateEmail = async (order) => {
  console.log(`📧 [EmailService] sendOrderStatusUpdateEmail called for order: ${order.id}, Status: ${order.status}`);
  const { gmailUser } = getEnvVars();
  const transporter = createTransporter();
  if (!transporter) {
    console.error("❌ [EmailService] Aborting status update email: No transporter.");
    return;
  }

  try {
    console.log("📧 [EmailService] Verifying SMTP connection for status update...");
    await transporter.verify();
  } catch (verifyError) {
    console.error("❌ [EmailService] SMTP Verification failed for status update:", verifyError.message);
    return;
  }

  const orderId = order.id ? order.id.slice(0, 6).toUpperCase() : "UNK";
  const customerEmail = order.customer?.email;
  const status = order.status;
  console.log(`📧 [EmailService] Customer Email for status update: ${customerEmail}`);

  try {
    if (customerEmail) {
      const subject = `Order #${orderId} Status Update: ${status ? status.toUpperCase() : "UPDATED"}`;
      console.log(`📧 [EmailService] Sending status update email to customer: ${customerEmail}`);
      await transporter.sendMail({
        from: `"Hedoomyy Store" <${gmailUser}>`,
        to: customerEmail,
        subject: subject,
        html: generateOrderHTML(order, true, true),
        text: `Your order #${order.id} status has been updated to ${status}.`,
      });
      console.log(`✅ [EmailService] Status update email sent successfully to ${customerEmail}`);
    }
  } catch (error) {
    console.error(`❌ [EmailService] Failed to send status update email:`, error.message);
  }
};

export const sendPaymentConfirmationEmail = async (order) => {
  console.log(`📧 [EmailService] sendPaymentConfirmationEmail called for order: ${order.id}`);
  const { gmailUser } = getEnvVars();
  const transporter = createTransporter();
  if (!transporter) {
    console.error("❌ [EmailService] Aborting payment confirmation email: No transporter.");
    return;
  }

  const orderId = order.id ? order.id.slice(0, 6).toUpperCase() : "UNK";
  const customerEmail = order.customer?.email;
  console.log(`📧 [EmailService] Customer Email for payment confirmation: ${customerEmail}`);

  try {
    if (customerEmail) {
      const subject = `Payment Verified - Order #${orderId} is being processed`;
      console.log(`📧 [EmailService] Sending payment confirmation email to customer: ${customerEmail}`);
      await transporter.sendMail({
        from: `"Hedoomyy Store" <${gmailUser}>`,
        to: customerEmail,
        subject: subject,
        html: generateOrderHTML({ ...order, status: 'payment_confirmed' }, true, true),
        text: `Your payment for order #${order.id} has been verified and is now being processed.`,
      });
      console.log(`✅ [EmailService] Payment confirmation email sent successfully to ${customerEmail}`);
    }
  } catch (error) {
    console.error(`❌ [EmailService] Failed to send payment confirmation email:`, error.message);
  }
};
