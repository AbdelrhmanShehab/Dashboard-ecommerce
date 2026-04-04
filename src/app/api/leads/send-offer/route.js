import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../../firebaseAdmin';
import { sendSpecialOfferEmail } from '../../../../utils/emailService';

export async function POST(request) {
  try {
    const { email, productId, discount, newPrice, originalPrice, productName, leadId } = await request.json();

    if (!email || !productId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();

    // 1. Update the lead status
    // Use leadId if provided, else fallback to composite key
    const docId = leadId || `${email}_${productId}`;
    const leadRef = db.collection('leads').doc(docId);
    
    await leadRef.set({
      status: 'offered',
      lastOffer: {
        discount,
        newPrice,
        originalPrice,
        sentAt: new Date()
      },
      updatedAt: new Date()
    }, { merge: true });

    // 2. Send the email
    try {
      await sendSpecialOfferEmail({
        email,
        productName,
        discount,
        newPrice,
        originalPrice
      });
    } catch (emailError) {
      console.error('📧 [API/Leads/SendOffer] Failed to send email:', emailError);
      // We still return 200 because the lead was updated in DB
    }

    // 3. Log activity
    try {
        await db.collection('activity_logs').add({
          action: 'Sent Special Offer',
          details: `Sent ${discount}% offer to ${email} for product ${productName}`,
          timestamp: new Date(),
        });
    } catch (logError) {
        console.error('❌ [API/Leads/SendOffer] Logging failed:', logError);
    }

    return NextResponse.json({ message: 'Offer sent and lead updated successfully' });

  } catch (error) {
    console.error('❌ [API/Leads/SendOffer] POST Error:', error);
    return NextResponse.json({ error: 'Failed to process offer' }, { status: 500 });
  }
}
