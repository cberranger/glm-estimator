import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_LAYERS } from '@/lib/types';

// GET - List all layers for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }
    
    const layers = await db.layoutLayer.findMany({
      where: { projectId },
      include: {
        elements: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
    
    // If no layers exist, create default layers
    if (layers.length === 0) {
      const createdLayers = await Promise.all(
        DEFAULT_LAYERS.map((layer, index) =>
          db.layoutLayer.create({
            data: {
              projectId,
              name: layer.name,
              tradeType: layer.tradeType,
              color: layer.color,
              isVisible: layer.isVisible,
              isLocked: layer.isLocked,
              sortOrder: index,
            },
            include: { elements: true },
          })
        )
      );
      return NextResponse.json(createdLayers);
    }
    
    return NextResponse.json(layers);
  } catch (error) {
    console.error('Error fetching layers:', error);
    return NextResponse.json({ error: 'Failed to fetch layers' }, { status: 500 });
  }
}

// POST - Create a new layer
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Get the highest sortOrder for this project
    const maxSortOrder = await db.layoutLayer.aggregate({
      where: { projectId: data.projectId },
      _max: { sortOrder: true },
    });
    
    const layer = await db.layoutLayer.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        tradeType: data.tradeType || 'architectural',
        color: data.color || '#3b82f6',
        isVisible: data.isVisible ?? true,
        isLocked: data.isLocked ?? false,
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
      },
      include: { elements: true },
    });
    
    return NextResponse.json(layer);
  } catch (error) {
    console.error('Error creating layer:', error);
    return NextResponse.json({ error: 'Failed to create layer' }, { status: 500 });
  }
}
