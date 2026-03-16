import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../../firebaseAdmin';

export async function POST(request) {
  try {
    const { title, category, cost, date, note, user } = await request.json();

    if (!title || !category || cost == null || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = await db.collection('expenses').add({
      title,
      category,
      cost: Number(cost),
      date,
      note: note || '',
      createdAt: new Date(),
      createdBy: user ? { uid: user.uid, email: user.email } : null,
    });

    return NextResponse.json({ id: docRef.id, message: 'Expense created' }, { status: 201 });
  } catch (error) {
    console.error('❌ [API/Finance/Expenses] POST Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create expense',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing expense id' }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection('expenses').doc(id).delete();

    return NextResponse.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('❌ [API/Finance/Expenses] DELETE Error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete expense',
      details: error.message
    }, { status: 500 });
  }
}
