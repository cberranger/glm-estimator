import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List line items as materials with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    const where: Record<string, unknown> = { isActive: true };
    
    if (search) {
      where.description = { contains: search };
    }
    
    const lineItems = await db.lineItem.findMany({
      where,
      include: {
        unit: true,
        workItem: {
          include: {
            category: {
              include: {
                division: true,
                parentCategory: true,
                subCategories: true,
              },
            },
          },
        },
        variantCosts: {
          include: {
            variant: true,
          },
        },
        laborCode: true,
      },
      orderBy: { description: 'asc' },
    });
    
    // Filter by division if provided
    let filteredItems = division && division !== 'all' 
      ? lineItems.filter(item => item.workItem?.category?.division?.divisionCode === division)
      : lineItems;
    
    // Filter by category if provided
    filteredItems = category && category !== 'all'
      ? filteredItems.filter(item => {
          const itemCategory = item.workItem?.category;
          // Match either the category itself or its parent
          return itemCategory?.id === category || 
                 itemCategory?.parentCategoryId === category;
        })
      : filteredItems;
    
    // Get all divisions with their categories
    const divisions = await db.division.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        categories: {
          where: { parentCategoryId: null }, // Only parent categories
          orderBy: { sortOrder: 'asc' },
          include: {
            subCategories: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
    
    return NextResponse.json({
      materials: filteredItems.map(item => {
        const itemCategory = item.workItem?.category;
        const parentCategory = itemCategory?.parentCategory;
        
        return {
          id: item.id,
          name: item.description,
          category: itemCategory?.categoryName || 'Uncategorized',
          categoryId: itemCategory?.id || null,
          parentCategory: parentCategory?.categoryName || null,
          parentCategoryId: parentCategory?.id || null,
          division: itemCategory?.division?.divisionName || '',
          divisionCode: itemCategory?.division?.divisionCode || '',
          unit: item.unit?.unitCode || 'EA',
          unitName: item.unit?.unitName || 'Each',
          unitPrice: item.totalCost,
          materialCost: item.materialCost,
          laborCost: item.laborCost,
          equipmentCost: item.equipmentCost,
          laborHours: item.laborHours,
          laborCode: item.laborCode?.codeName,
          variants: item.variantCosts.map(v => ({
            id: v.id,
            variantId: v.variantId,
            name: v.variant.variantName,
            materialCost: v.materialCost,
            laborCost: v.laborCost,
            equipmentCost: v.equipmentCost,
            totalCost: v.totalCost,
          })),
        };
      }),
      divisions: divisions.map(d => ({ 
        code: d.divisionCode, 
        name: d.divisionName,
        title: d.divisionTitle,
        categories: d.categories.map(c => ({
          id: c.id,
          name: c.categoryName,
          description: c.description,
          subcategories: c.subCategories.map(sc => ({
            id: sc.id,
            name: sc.categoryName,
            description: sc.description,
          })),
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}
