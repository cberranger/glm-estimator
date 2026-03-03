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
        project: true,
        areaModifier: true,
        lineItems: {
          include: {
            lineItem: {
              include: {
                unit: true,
                workItem: {
                  include: {
                    category: {
                      include: {
                        division: true,
                      },
                    },
                  },
                },
              },
            },
            variant: true,
            unit: true,
            room: true,
          },
          orderBy: { displayOrder: 'asc' },
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
    
    const estimate = await db.estimate.update({
      where: { id },
      data: {
        estimateName: data.name,
        projectName: data.projectName,
        projectLocation: data.projectLocation,
        estimateStatus: data.status,
        profitMargin: data.profitMargin,
        taxRate: data.taxRate,
        notes: data.notes,
      },
      include: {
        lineItems: {
          include: {
            lineItem: true,
            variant: true,
            unit: true,
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
    
    // First delete all line items associated with this estimate
    await db.estimateLineItem.deleteMany({
      where: { estimateId: id },
    });
    
    // Then delete the estimate
    await db.estimate.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json({ error: 'Failed to delete estimate' }, { status: 500 });
  }
}
