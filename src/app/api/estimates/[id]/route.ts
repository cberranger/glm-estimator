import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const estimate = await db.estimate.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            rooms: true,
          },
        },
        lineItems: {
          include: {
            material: true,
            labor: true,
            room: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }
    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return NextResponse.json({ error: 'Failed to fetch estimate' }, { status: 500 });
  }
}

// PUT - Update estimate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Recalculate totals
    const subtotal = data.subtotal || 0;
    const taxAmount = subtotal * (data.taxRate || 0);
    const profitAmount = subtotal * (data.profitMargin || 0.2);
    const totalAmount = subtotal + taxAmount + profitAmount;
    
    const estimate = await db.estimate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        notes: data.notes,
        terms: data.terms,
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        totalAmount,
        profitMargin: data.profitMargin,
      },
      include: {
        lineItems: {
          include: {
            material: true,
            labor: true,
            room: true,
          },
        },
      },
    });
    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error updating estimate:', error);
    return NextResponse.json({ error: 'Failed to update estimate' }, { status: 500 });
  }
}

// DELETE - Delete estimate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.estimate.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json({ error: 'Failed to delete estimate' }, { status: 500 });
  }
}
