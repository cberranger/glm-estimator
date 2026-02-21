import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single element
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const element = await db.layoutElement.findUnique({
      where: { id },
      include: {
        layer: true,
        room: true,
      },
    });
    if (!element) {
      return NextResponse.json({ error: 'Element not found' }, { status: 404 });
    }
    return NextResponse.json(element);
  } catch (error) {
    console.error('Error fetching element:', error);
    return NextResponse.json({ error: 'Failed to fetch element' }, { status: 500 });
  }
}

// PUT - Update element
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const element = await db.layoutElement.update({
      where: { id },
      data: {
        roomId: data.roomId,
        layerId: data.layerId,
        positionX: data.positionX,
        positionY: data.positionY,
        width: data.width,
        height: data.height,
        rotation: data.rotation,
        properties: data.properties,
        color: data.color,
        label: data.label,
        notes: data.notes,
        sortOrder: data.sortOrder,
      },
      include: {
        layer: true,
        room: true,
      },
    });
    return NextResponse.json(element);
  } catch (error) {
    console.error('Error updating element:', error);
    return NextResponse.json({ error: 'Failed to update element' }, { status: 500 });
  }
}

// DELETE - Delete element
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.layoutElement.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting element:', error);
    return NextResponse.json({ error: 'Failed to delete element' }, { status: 500 });
  }
}
