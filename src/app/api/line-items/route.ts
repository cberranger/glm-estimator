import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List line items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estimateId = searchParams.get('estimateId');
    const roomId = searchParams.get('roomId');
    
    const where: Record<string, unknown> = {};
    if (estimateId) where.estimateId = estimateId;
    if (roomId) where.roomId = roomId;
    
    const lineItems = await db.estimateLineItem.findMany({
      where,
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
            laborCode: true,
          },
        },
        variant: true,
        unit: true,
        room: true,
      },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json(lineItems);
  } catch (error) {
    console.error('Error fetching line items:', error);
    return NextResponse.json({ error: 'Failed to fetch line items' }, { status: 500 });
  }
}

// POST - Create line item
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Get line item details if referenced
    let materialCost = data.overrideMaterialCost;
    let laborCost = data.overrideLaborCost;
    let equipmentCost = data.overrideEquipmentCost;
    let unitId = data.unitId;
    
    if (data.lineItemId && (materialCost === undefined || laborCost === undefined)) {
      const lineItem = await db.lineItem.findUnique({
        where: { id: data.lineItemId },
        include: {
          unit: true,
          variantCosts: data.variantId ? {
            where: { variantId: data.variantId },
          } : undefined,
        },
      });
      
      if (lineItem) {
        unitId = unitId || lineItem.unitId;
        
        // Use variant costs if variant is specified
        if (data.variantId && lineItem.variantCosts.length > 0) {
          const variantCost = lineItem.variantCosts[0];
          materialCost = materialCost ?? variantCost.materialCost;
          laborCost = laborCost ?? variantCost.laborCost;
          equipmentCost = equipmentCost ?? variantCost.equipmentCost;
        } else {
          materialCost = materialCost ?? lineItem.materialCost;
          laborCost = laborCost ?? lineItem.laborCost;
          equipmentCost = equipmentCost ?? lineItem.equipmentCost;
        }
      }
    }
    
    const quantity = data.quantity || 1;
    const lineTotalMaterialCost = (materialCost || 0) * quantity;
    const lineTotalLaborCost = (laborCost || 0) * quantity;
    const lineTotalEquipmentCost = (equipmentCost || 0) * quantity;
    const lineTotal = lineTotalMaterialCost + lineTotalLaborCost + lineTotalEquipmentCost;
    
    // Get max display order
    const maxOrder = await db.estimateLineItem.aggregate({
      where: { estimateId: data.estimateId },
      _max: { displayOrder: true },
    });
    
    const estimateLineItem = await db.estimateLineItem.create({
      data: {
        estimateId: data.estimateId,
        lineItemId: data.lineItemId,
        variantId: data.variantId,
        roomId: data.roomId,
        quantity,
        unitId,
        overrideMaterialCost: materialCost,
        overrideLaborCost: laborCost,
        overrideEquipmentCost: equipmentCost,
        lineTotalMaterialCost,
        lineTotalLaborCost,
        lineTotalEquipmentCost,
        lineTotal,
        notes: data.notes,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
      include: {
        lineItem: {
          include: {
            unit: true,
            workItem: {
              include: {
                category: true,
              },
            },
          },
        },
        variant: true,
        unit: true,
        room: true,
      },
    });
    
    // Update estimate totals
    await updateEstimateTotals(data.estimateId);
    
    return NextResponse.json(estimateLineItem);
  } catch (error) {
    console.error('Error creating line item:', error);
    return NextResponse.json({ error: 'Failed to create line item' }, { status: 500 });
  }
}

// PUT - Update line item
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    const quantity = data.quantity || 1;
    const materialCost = data.overrideMaterialCost || 0;
    const laborCost = data.overrideLaborCost || 0;
    const equipmentCost = data.overrideEquipmentCost || 0;
    
    const lineTotalMaterialCost = materialCost * quantity;
    const lineTotalLaborCost = laborCost * quantity;
    const lineTotalEquipmentCost = equipmentCost * quantity;
    const lineTotal = lineTotalMaterialCost + lineTotalLaborCost + lineTotalEquipmentCost;
    
    const lineItem = await db.estimateLineItem.update({
      where: { id: data.id },
      data: {
        quantity,
        overrideMaterialCost: materialCost,
        overrideLaborCost: laborCost,
        overrideEquipmentCost: equipmentCost,
        lineTotalMaterialCost,
        lineTotalLaborCost,
        lineTotalEquipmentCost,
        lineTotal,
        notes: data.notes,
        displayOrder: data.sortOrder,
        variantId: data.variantId,
      },
      include: {
        lineItem: true,
        variant: true,
        unit: true,
        room: true,
      },
    });
    
    // Update estimate totals
    if (data.estimateId) {
      await updateEstimateTotals(data.estimateId);
    }
    
    return NextResponse.json(lineItem);
  } catch (error) {
    console.error('Error updating line item:', error);
    return NextResponse.json({ error: 'Failed to update line item' }, { status: 500 });
  }
}

// DELETE - Delete line item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const estimateId = searchParams.get('estimateId');
    
    if (!id) {
      return NextResponse.json({ error: 'Line item ID required' }, { status: 400 });
    }
    
    await db.estimateLineItem.delete({
      where: { id },
    });
    
    // Update estimate totals
    if (estimateId) {
      await updateEstimateTotals(estimateId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting line item:', error);
    return NextResponse.json({ error: 'Failed to delete line item' }, { status: 500 });
  }
}

// Helper to update estimate totals
async function updateEstimateTotals(estimateId: string) {
  const lineItems = await db.estimateLineItem.findMany({
    where: { estimateId },
  });
  
  const totalMaterialCost = lineItems.reduce((sum, item) => sum + (item.lineTotalMaterialCost || 0), 0);
  const totalLaborCost = lineItems.reduce((sum, item) => sum + (item.lineTotalLaborCost || 0), 0);
  const totalEquipmentCost = lineItems.reduce((sum, item) => sum + (item.lineTotalEquipmentCost || 0), 0);
  const totalCost = totalMaterialCost + totalLaborCost + totalEquipmentCost;
  
  await db.estimate.update({
    where: { id: estimateId },
    data: {
      totalMaterialCost,
      totalLaborCost,
      totalEquipmentCost,
      totalCost,
    },
  });
}
