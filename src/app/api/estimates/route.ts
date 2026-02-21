import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all estimates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const estimates = await db.estimate.findMany({
      where: projectId ? { projectId } : undefined,
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
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(estimates);
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

// POST - Create new estimate
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create estimate with line items
    const estimate = await db.estimate.create({
      data: {
        projectId: data.projectId,
        estimateName: data.name,
        projectName: data.projectName,
        projectLocation: data.projectLocation,
        estimateStatus: data.status || 'draft',
        profitMargin: data.profitMargin || 0.2,
        taxRate: data.taxRate || 0.08,
        totalMaterialCost: 0,
        totalLaborCost: 0,
        totalEquipmentCost: 0,
        totalCost: 0,
        lineItems: data.lineItems ? {
          create: data.lineItems.map((item: Record<string, unknown>, index: number) => ({
            lineItemId: item.lineItemId as string,
            variantId: item.variantId as string,
            roomId: item.roomId as string,
            quantity: item.quantity as number,
            unitId: item.unitId as string,
            overrideMaterialCost: item.overrideMaterialCost as number,
            overrideLaborCost: item.overrideLaborCost as number,
            overrideEquipmentCost: item.overrideEquipmentCost as number,
            lineTotalMaterialCost: item.lineTotalMaterialCost as number || 0,
            lineTotalLaborCost: item.lineTotalLaborCost as number || 0,
            lineTotalEquipmentCost: item.lineTotalEquipmentCost as number || 0,
            lineTotal: item.lineTotal as number || 0,
            notes: item.notes as string,
            displayOrder: index,
          })),
        } : undefined,
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
    
    // Calculate totals
    const totals = await calculateEstimateTotals(estimate.id);
    
    return NextResponse.json({ ...estimate, ...totals });
  } catch (error) {
    console.error('Error creating estimate:', error);
    return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 });
  }
}

// Helper to calculate estimate totals
async function calculateEstimateTotals(estimateId: string) {
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
  
  return { totalMaterialCost, totalLaborCost, totalEquipmentCost, totalCost };
}
