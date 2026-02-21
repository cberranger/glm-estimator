import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single layer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const layer = await db.layoutLayer.findUnique({
      where: { id },
      include: {
        elements: true,
      },
    });
    if (!layer) {
      return NextResponse.json({ error: 'Layer not found' }, { status: 404 });
    }
    return NextResponse.json(layer);
  } catch (error) {
    console.error('Error fetching layer:', error);
    return NextResponse.json({ error: 'Failed to fetch layer' }, { status: 500 });
  }
}

// PUT - Update layer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const layer = await db.layoutLayer.update({
      where: { id },
      data: {
        name: data.name,
        tradeType: data.tradeType,
        color: data.color,
        isVisible: data.isVisible,
        isLocked: data.isLocked,
        sortOrder: data.sortOrder,
      },
      include: { elements: true },
    });
    return NextResponse.json(layer);
  } catch (error) {
    console.error('Error updating layer:', error);
    return NextResponse.json({ error: 'Failed to update layer' }, { status: 500 });
  }
}

// DELETE - Delete layer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Elements will be cascade deleted
    await db.layoutLayer.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting layer:', error);
    return NextResponse.json({ error: 'Failed to delete layer' }, { status: 500 });
  }
}
