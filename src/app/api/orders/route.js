import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function POST(req) {
  try {
    const body = await req.json();
    const { items, customer, delivery, payment } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty." },
        { status: 400 }
      );
    }

    let subtotal = 0;

    /* ---------------- STOCK VALIDATION ---------------- */

    for (const item of items) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        return NextResponse.json(
          { success: false, message: "Product not found." },
          { status: 404 }
        );
      }

      const product = productSnap.data();

      const variant = product.variants?.find(
        (v) => v.id === item.variantId
      );

      if (!variant) {
        return NextResponse.json(
          { success: false, message: "Variant not found." },
          { status: 404 }
        );
      }

      if ((variant.stock || 0) < item.qty) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough stock for ${product.title}`,
          },
          { status: 400 }
        );
      }

      /* Reduce Stock */
      variant.stock -= item.qty;

      subtotal += item.price * item.qty;

      await updateDoc(productRef, {
        variants: product.variants,
        totalStock: product.variants.reduce(
          (sum, v) => sum + (v.stock || 0),
          0
        ),
        updatedAt: serverTimestamp(),
      });
    }

    const shipping = 50;
    const total = subtotal + shipping;

    /* ---------------- SAVE ORDER ---------------- */

    const orderRef = await addDoc(collection(db, "orders"), {
      items,
      customer,
      delivery,
      payment: {
        method: payment,
        paid: false,
      },
      totals: {
        subtotal,
        shipping,
        total,
      },
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    /* ---------------- SEND EMAIL ---------------- */

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const orderLines = items
      .map(
        (i) =>
          `• ${i.title} (${i.color || ""} ${i.size || ""}) x${i.qty}`
      )
      .join("\n");

    const emailText = `
New Order Received

Order ID: ${orderRef.id}

Customer: ${delivery.firstName} ${delivery.lastName}
Phone: ${delivery.phone}

Items:
${orderLines}

Total: ${total} EGP
Payment: ${payment}
`;

    /* Send to Admin */
    await transporter.sendMail({
      from: `"Hedoomyy" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "🛒 New Order Received",
      text: emailText,
    });

    /* Send to Customer */
    await transporter.sendMail({
      from: `"Hedoomyy" <${process.env.GMAIL_USER}>`,
      to: customer.email,
      subject: "Your Order Confirmation",
      text: `Thank you for your order!\n\n${emailText}`,
    });

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
    });
  } catch (error) {
    console.error("ORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
