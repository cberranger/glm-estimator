import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all rooms (optionally filtered by project)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const rooms = await db.room.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: true,
        lineItems: {
          include: {
            material: true,
            labor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

// POST - Create new room
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const floorArea = data.length * data.width;
    const perimeter = 2 * (data.length + data.width);
    const wallArea = perimeter * (data.height || 8);
    
    const room = await db.room.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        roomType: data.roomType,
        length: data.length,
        width: data.width,
        height: data.height || 8,
        floorArea,
        wallArea,
        notes: data.notes,
        positionX: data.positionX || 0,
        positionY: data.positionY || 0,
        rotation: data.rotation || 0,
      },
    });
    return NextResponse.json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
