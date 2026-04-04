import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../firebaseAdmin';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendPaymentConfirmationEmail } from '../../../utils/emailService';

export async function POST(request) {
  try {
    const orderData = await request.json();
    const db = getAdminDb();

    // Add server-side timestamps
    const orderWithTimestamp = {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: orderData.status || 'pending'
    };

    const docRef = await db.collection('orders').add(orderWithTimestamp);
    const orderId = docRef.id;

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail({ id: orderId, ...orderWithTimestamp });
    } catch (emailError) {
      console.error('📧 [API/Orders] Failed to send confirmation email:', emailError);
    }

    // Clear leads for this customer and products
    const email = orderData.customer?.email;
    if (email) {
      try {
        const items = orderData.items || [];
        for (const item of items) {
          if (item.productId) {
            await db.collection('leads').doc(`${email}_${item.productId}`).set({
              status: 'converted',
              updatedAt: new Date()
            }, { merge: true });
          }
        }
      } catch (leadError) {
        console.error('❌ [API/Orders] Failed to clear leads:', leadError);
      }
    }

    return NextResponse.json({
      message: 'Order created successfully',
      orderId: orderId
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [API/Orders] POST Error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { orderId, status, paymentPaid, paymentFullyPaid, user, message } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderSnap.data();
    const updates = { updatedAt: new Date() };
    const messages = [];

    // Handle Status Update
    if (status && status !== orderData.status) {
      // STOCK LOGIC: IF ANY -> CANCELLED
      if (status === "cancelled" && orderData.status !== "cancelled") {
        const items = orderData.items || [];
        for (const item of items) {
          if (!item.productId || !item.variantId) continue;
          const productRef = db.collection('products').doc(item.productId);
          const productSnap = await productRef.get().catch(() => null);
          if (productSnap && productSnap.exists) {
            const product = productSnap.data();
            const variants = product.variants || [];
            const updatedVariants = variants.map((v) => {
              if (v.id === item.variantId) {
                return { ...v, stock: (v.stock || 0) + item.qty };
              }
              return v;
            });
            await productRef.update({
              variants: updatedVariants,
              totalStock: updatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
            }).catch(err => console.error(`Failed to update stock for product ${item.productId}:`, err));
          }
        }
      }

      // STOCK LOGIC: IF CANCELLED -> ANY (EXCEPT CANCELLED)
      if (orderData.status === "cancelled" && status !== "cancelled") {
        const items = orderData.items || [];
        for (const item of items) {
          if (!item.productId || !item.variantId) continue;
          const productRef = db.collection('products').doc(item.productId);
          const productSnap = await productRef.get().catch(() => null);
          if (productSnap && productSnap.exists) {
            const product = productSnap.data();
            const variants = product.variants || [];
            const updatedVariants = variants.map((v) => {
              if (v.id === item.variantId) {
                return { ...v, stock: Math.max(0, (v.stock || 0) - item.qty) };
              }
              return v;
            });
            await productRef.update({
              variants: updatedVariants,
              totalStock: updatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
            }).catch(err => console.error(`Failed to update stock for product ${item.productId}:`, err));
          }
        }
      }

      updates.status = status;
      messages.push(`Status updated to ${status}`);

      // If order is confirmed, clear related leads
      if (status === 'confirmed') {
        const email = orderData.customer?.email;
        if (email) {
          try {
            const items = orderData.items || [];
            for (const item of items) {
              if (item.productId) {
                await db.collection('leads').doc(`${email}_${item.productId}`).set({
                  status: 'converted',
                  updatedAt: new Date()
                }, { merge: true });
              }
            }
          } catch (leadError) {
            console.error('❌ [API/Orders] Failed to clear leads on confirmation:', leadError);
          }
        }
      }
    }

    // Handle Payment Update
    if (paymentPaid !== undefined) {
      updates['payment.paid'] = paymentPaid;

      if (paymentPaid === true) {
        updates['payment.paidAt'] = new Date(); // Track when it was paid!
        messages.push(`Payment marked as paid`);
        // Send payment confirmation email
        try {
          await sendPaymentConfirmationEmail({ id: orderId, ...orderData });
        } catch (emailError) {
          console.error('📧 [API/Orders] Failed to send payment confirmation email:', emailError);
        }
      } else {
        messages.push(`Payment rejected`);
        // If not already handling status change to cancelled from frontend, do it here
        if (!status || status !== 'cancelled') {
          updates.status = 'cancelled';
        }
        // Send status update email for rejection (we mark this so we don't send duplicate later)
        try {
          await sendOrderStatusUpdateEmail({ id: orderId, ...orderData, status: 'cancelled', message });
        } catch (emailError) {
          console.error('📧 [API/Orders] Failed to send payment rejection email:', emailError);
        }
      }
    }

    if (paymentFullyPaid !== undefined) {
      updates['payment.fullyPaid'] = paymentFullyPaid;
      if (paymentFullyPaid === true) {
        updates['payment.paid'] = true; // If fully paid, it's also implicitly paid (deposit included)
        updates['payment.paidAt'] = new Date();
        updates['payment.fullyPaidAt'] = new Date(); // Track when final balance was paid!
        messages.push(`Total amount collected`);
      }
    }

    await orderRef.update(updates);

    // Activity Logging (Server-side equivalent)
    if (user) {
      try {
        await db.collection('activity_logs').add({
          action: status ? 'Updated Order Status' : 'Updated Payment Status',
          details: status
            ? `Changed order #${orderId.slice(0, 6).toUpperCase()} status to ${status}`
            : `Marked order #${orderId.slice(0, 6).toUpperCase()} as ${paymentPaid ? 'paid' : 'unpaid'}`,
          user: {
            uid: user.uid,
            email: user.email,
            name: user.displayName || "Admin",
          },
          timestamp: new Date(),
          changes: status ? { status: { from: orderData.status, to: status } } : null
        });
      } catch (logError) {
        console.error('❌ [API/Orders] Logging failed:', logError);
      }
    }

    // Send status update email if status changed (and not already handled by payment rejection)
    if (status && status !== orderData.status && (paymentPaid === undefined || paymentPaid === true)) {
      try {
        await sendOrderStatusUpdateEmail({ id: orderId, ...orderData, status, message });
      } catch (emailError) {
        console.error('📧 [API/Orders] Failed to send status update email:', emailError);
      }
    }

    return NextResponse.json({ message: messages.join('. ') });

  } catch (error) {
    console.error('❌ [API/Orders] PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
