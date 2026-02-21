import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all elements for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const layerId = searchParams.get('layerId');
    const roomId = searchParams.get('roomId');
    
    const where: {
      projectId?: string;
      layerId?: string;
      roomId?: string | null;
    } = {};
    
    if (projectId) where.projectId = projectId;
    if (layerId) where.layerId = layerId;
    if (roomId) where.roomId = roomId;
    
    const elements = await db.layoutElement.findMany({
      where,
      include: {
        layer: true,
        room: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    
    return NextResponse.json(elements);
  } catch (error) {
    console.error('Error fetching elements:', error);
    return NextResponse.json({ error: 'Failed to fetch elements' }, { status: 500 });
  }
}

// POST - Create a new element
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const element = await db.layoutElement.create({
      data: {
        projectId: data.projectId,
        layerId: data.layerId,
        roomId: data.roomId,
        elementType: data.elementType,
        subType: data.subType,
        category: data.category,
        positionX: data.positionX ?? 0,
        positionY: data.positionY ?? 0,
        width: data.width ?? 3,
        height: data.height ?? 7,
        rotation: data.rotation ?? 0,
        properties: data.properties,
        color: data.color,
        icon: data.icon,
        label: data.label,
        notes: data.notes,
      },
      include: {
        layer: true,
        room: true,
      },
    });
    
    return NextResponse.json(element);
  } catch (error) {
    console.error('Error creating element:', error);
    return NextResponse.json({ error: 'Failed to create element' }, { status: 500 });
  }
}
