import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Export estimate to PDF/HTML
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { estimateId } = data;
    
    const estimate = await db.estimate.findUnique({
      where: { id: estimateId },
      include: {
        project: {
          include: {
            rooms: true,
          },
        },
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
    
    // Generate HTML for PDF
    const html = generateEstimateHTML(estimate as EstimateWithIncludes);
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="estimate-${estimate.id}.html"`,
      },
    });
  } catch (error) {
    console.error('Error exporting estimate:', error);
    return NextResponse.json({ error: 'Failed to export estimate' }, { status: 500 });
  }
}

// Type for estimate with includes - explicitly defined to match Prisma query shape
type EstimateWithIncludes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  totalCost: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalEquipmentCost: number;
  profitMargin: number;
  taxRate: number;
  notes: string | null;
  estimateName: string;
  estimateStatus: string;
  projectName: string | null;
  projectLocation: string | null;
  project: {
    name: string;
    address: string | null;
    clientName: string | null;
    clientEmail: string | null;
    clientPhone: string | null;
    rooms: { id: string; name: string }[];
  };
  lineItems: EstimateLineItemWithIncludes[];
};

type EstimateLineItemWithIncludes = {
  id: string;
  quantity: number;
  lineTotalMaterialCost: number;
  lineTotalLaborCost: number;
  lineTotalEquipmentCost: number;
  lineTotal: number;
  notes: string | null;
  lineItem: {
    description: string;
    workItem: {
      category: {
        categoryName: string;
        division: {
          divisionName: string;
        };
      };
    } | null;
  } | null;
  variant: { variantName: string } | null;
  room: { name: string } | null;
  unit: { unitCode: string; unitName: string } | null;
};

function generateEstimateHTML(estimate: EstimateWithIncludes): string {
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  
  // Group line items by division
  const groupedItems = estimate.lineItems.reduce((acc, item) => {
    const division = item.lineItem?.workItem?.category?.division?.divisionName || 'Other';
    if (!acc[division]) acc[division] = [];
    acc[division].push(item);
    return acc;
  }, {} as Record<string, typeof estimate.lineItems>);
  
  const profitAmount = estimate.totalCost * estimate.profitMargin;
  const taxAmount = estimate.totalCost * estimate.taxRate;
  const grandTotal = estimate.totalCost + profitAmount + taxAmount;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estimate - ${estimate.estimateName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1f2937;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28px;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .header .subtitle {
      color: #6b7280;
      font-size: 14px;
    }
    .company-info { float: left; }
    .estimate-info { float: right; text-align: right; }
    .clearfix::after { content: ""; clear: both; display: table; }
    .section { margin-bottom: 30px; }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 6px; }
    .info-box h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
    .info-box p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th {
      background: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      color: #374151;
    }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .category-header { background: #f9fafb; font-weight: 600; color: #374151; }
    .text-right { text-align: right; }
    .totals { margin-top: 20px; border-top: 2px solid #e5e7eb; padding-top: 15px; }
    .totals-row { display: flex; justify-content: flex-end; margin: 8px 0; }
    .totals-label { width: 150px; text-align: right; padding-right: 15px; }
    .totals-value { width: 100px; text-align: right; font-weight: 500; }
    .grand-total {
      font-size: 16px;
      font-weight: 700;
      color: #2563eb;
      border-top: 2px solid #2563eb;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
    @media print { body { padding: 20px; } .section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header clearfix">
    <div class="company-info">
      <h1>CONSTRUCTION ESTIMATE</h1>
      <div class="subtitle">${estimate.estimateName}</div>
    </div>
    <div class="estimate-info">
      <p><strong>Estimate #:</strong> ${estimate.id.slice(-8).toUpperCase()}</p>
      <p><strong>Date:</strong> ${formatDate(estimate.createdAt)}</p>
      <p><strong>Status:</strong> ${estimate.estimateStatus}</p>
    </div>
  </div>
  
  <div class="section">
    <div class="info-grid">
      <div class="info-box">
        <h3>Client Information</h3>
        <p><strong>${estimate.project.clientName || 'Client'}</strong></p>
        ${estimate.project.clientEmail ? `<p>${estimate.project.clientEmail}</p>` : ''}
        ${estimate.project.clientPhone ? `<p>${estimate.project.clientPhone}</p>` : ''}
      </div>
      <div class="info-box">
        <h3>Project Details</h3>
        <p><strong>${estimate.projectName || estimate.project.name}</strong></p>
        ${estimate.projectLocation || estimate.project.address ? `<p>${estimate.projectLocation || estimate.project.address}</p>` : ''}
      </div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Line Items</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Room</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit</th>
          <th class="text-right">Material</th>
          <th class="text-right">Labor</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(groupedItems).map(([division, items]) => `
          <tr class="category-header">
            <td colspan="7">${division}</td>
          </tr>
          ${items.map(item => `
            <tr>
              <td>
                ${item.lineItem?.description || 'Unknown'}
                ${item.variant ? `<br><small style="color:#6b7280">${item.variant.variantName}</small>` : ''}
              </td>
              <td>${item.room?.name || '-'}</td>
              <td class="text-right">${item.quantity.toLocaleString()}</td>
              <td class="text-right">${item.unit?.unitCode || '-'}</td>
              <td class="text-right">${formatCurrency(item.lineTotalMaterialCost)}</td>
              <td class="text-right">${formatCurrency(item.lineTotalLaborCost)}</td>
              <td class="text-right">${formatCurrency(item.lineTotal)}</td>
            </tr>
          `).join('')}
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="totals">
    <div class="totals-row">
      <div class="totals-label">Material Total:</div>
      <div class="totals-value">${formatCurrency(estimate.totalMaterialCost)}</div>
    </div>
    <div class="totals-row">
      <div class="totals-label">Labor Total:</div>
      <div class="totals-value">${formatCurrency(estimate.totalLaborCost)}</div>
    </div>
    <div class="totals-row">
      <div class="totals-label">Equipment Total:</div>
      <div class="totals-value">${formatCurrency(estimate.totalEquipmentCost)}</div>
    </div>
    <div class="totals-row" style="font-weight:600; border-top:1px solid #e5e7eb; padding-top:8px;">
      <div class="totals-label">Subtotal:</div>
      <div class="totals-value">${formatCurrency(estimate.totalCost)}</div>
    </div>
    <div class="totals-row">
      <div class="totals-label">Profit (${(estimate.profitMargin * 100).toFixed(0)}%):</div>
      <div class="totals-value">${formatCurrency(profitAmount)}</div>
    </div>
    ${estimate.taxRate > 0 ? `
    <div class="totals-row">
      <div class="totals-label">Tax (${(estimate.taxRate * 100).toFixed(1)}%):</div>
      <div class="totals-value">${formatCurrency(taxAmount)}</div>
    </div>
    ` : ''}
    <div class="totals-row grand-total">
      <div class="totals-label">Total:</div>
      <div class="totals-value">${formatCurrency(grandTotal)}</div>
    </div>
  </div>
  
  <div class="footer">
    <p>Thank you for your business. This estimate is valid for 30 days.</p>
  </div>
</body>
</html>
  `;
}
