import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = await db.room.findUnique({
      where: { id },
      include: {
        project: true,
        lineItems: {
          include: {
            material: true,
            labor: true,
          },
        },
      },
    });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}

// PUT - Update room
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Recalculate areas if dimensions change
    const floorArea = data.length && data.width ? data.length * data.width : undefined;
    const wallArea = data.length && data.width && data.height 
      ? 2 * (data.length + data.width) * data.height 
      : undefined;
    
    const room = await db.room.update({
      where: { id },
      data: {
        name: data.name,
        roomType: data.roomType,
        length: data.length,
        width: data.width,
        height: data.height,
        floorArea,
        wallArea,
        notes: data.notes,
        positionX: data.positionX,
        positionY: data.positionY,
        rotation: data.rotation,
      },
    });
    return NextResponse.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

// DELETE - Delete room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.room.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
