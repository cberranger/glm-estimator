/**
 * Import script for construction estimating data from OCR'd JSON files
 * Processes JSON files exported from PDF OCR runs
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Craft code definitions with hourly rates
const CRAFT_CODES: Record<string, { name: string; rate: number }> = {
  'B1': { name: 'Builder/Carpenter', rate: 35.70 },
  'BC': { name: 'Builder/Carpenter Helper', rate: 19.70 },
  'M8': { name: 'Pipefitter', rate: 60.00 },
  'SW': { name: 'Sheet Metal Worker', rate: 44.60 },
  'E1': { name: 'Electrician', rate: 52.40 },
  'P1': { name: 'Plumber', rate: 48.20 },
  'L1': { name: 'Laborer', rate: 22.50 },
  'I1': { name: 'Iron Worker', rate: 47.30 },
  'C1': { name: 'Cement Mason', rate: 38.90 },
  'R1': { name: 'Roofer', rate: 35.60 },
  'PA': { name: 'Painter', rate: 32.40 },
  'DV': { name: 'Drywall Installer', rate: 34.50 },
  'FT': { name: 'Floor Tile Setter', rate: 39.80 },
  'GL': { name: 'Glazier', rate: 42.50 },
  'HV': { name: 'HVAC Technician', rate: 48.50 },
};

// Unit definitions
const UNIT_DEFINITIONS: Record<string, { name: string; description: string }> = {
  'Ea': { name: 'Each', description: 'Per unit/piece' },
  'LF': { name: 'Linear Foot', description: 'Per linear foot' },
  'SF': { name: 'Square Foot', description: 'Per square foot' },
  'SY': { name: 'Square Yard', description: 'Per square yard' },
  'CF': { name: 'Cubic Foot', description: 'Per cubic foot' },
  'CY': { name: 'Cubic Yard', description: 'Per cubic yard' },
  'MBF': { name: 'Thousand Board Feet', description: 'Per 1000 board feet' },
  'MSF': { name: 'Thousand Square Feet', description: 'Per 1000 square feet' },
  'Ton': { name: 'Ton', description: 'Per ton (2000 lbs)' },
  'Lb': { name: 'Pound', description: 'Per pound' },
  'Gal': { name: 'Gallon', description: 'Per gallon' },
  'Set': { name: 'Set', description: 'Per set' },
  'Hr': { name: 'Hour', description: 'Per hour' },
  'Day': { name: 'Day', description: 'Per day' },
  'Week': { name: 'Week', description: 'Per week' },
  'LS': { name: 'Lump Sum', description: 'Fixed price' },
  'Pct': { name: 'Percentage', description: 'Percentage of cost' },
  '%': { name: 'Percentage', description: 'Percentage adjustment' },
};

// CSI Division mapping based on file names
const FILE_TO_DIVISION: Record<string, { code: string; name: string; title: string }> = {
  '1-100': { code: '08', name: 'Openings', title: 'Doors and Windows' },
  '101-200': { code: '08', name: 'Openings', title: 'Doors and Windows' },
  '201-300': { code: '08', name: 'Openings', title: 'Doors and Windows' },
  '301-400': { code: '08', name: 'Openings', title: 'Doors and Windows' },
  '401-500': { code: '09', name: 'Finishes', title: 'Finishes' },
  '501-600': { code: '22', name: 'Plumbing', title: 'Plumbing' },
  '601-700': { code: '23', name: 'HVAC', title: 'Heating, Ventilating, and Air Conditioning' },
};

interface OCRTable {
  headers: string[];
  rows: string[][];
}

interface OCRPage {
  page: number;
  tables: OCRTable[];
  markdown?: string;
  content?: string;
}

interface OCRRun {
  fileId: string;
  fileName: string;
  pages: OCRPage[];
}

interface JSONExport {
  exportedAt: string;
  totalFiles: number;
  runs: Record<string, OCRRun>;
}

// Parse craft code from string like "B1@1.00"
function parseCraftCode(craftStr: string): { code: string; hours: number } | null {
  if (!craftStr || craftStr === '—' || craftStr.trim() === '') return null;
  
  const match = craftStr.match(/^([A-Za-z0-9]+)@?([\d.]+)?$/);
  if (match) {
    return {
      code: match[1].toUpperCase(),
      hours: parseFloat(match[2] || '0'),
    };
  }
  return null;
}

// Parse cost string (remove commas, handle dashes)
function parseCost(costStr: string): number {
  if (!costStr || costStr === '—' || costStr.trim() === '') return 0;
  const cleaned = costStr.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Check if a row is a section header (no cost data)
function isSectionHeader(row: string[]): boolean {
  const [, craft, unit, material, labor, total] = row;
  return (!craft || craft === '') && 
         (!unit || unit === '') && 
         (!material || material === '' || material === '—') && 
         (!labor || labor === '' || labor === '—');
}

// Extract section description from header row
function extractSectionDescription(row: string[]): string {
  return row[0]?.trim() || '';
}

// Generate a unique line item ID
function generateLineItemId(filePrefix: string, pageIndex: number, rowIndex: number): string {
  return `${filePrefix}-${String(pageIndex + 1).padStart(3, '0')}-${String(rowIndex + 1).padStart(3, '0')}`;
}

// Process a single JSON file
async function processJsonFile(filePath: string): Promise<{
  stats: { units: number; laborCodes: number; lineItems: number; workItems: number };
  errors: string[];
}> {
  const stats = { units: 0, laborCodes: 0, lineItems: 0, workItems: 0 };
  const errors: string[] = [];
  
  const fileName = path.basename(filePath, '.json.txt');
  const filePrefix = fileName.replace(/\.json$/, '');
  
  // Determine division from file name
  let divisionInfo = FILE_TO_DIVISION[filePrefix];
  if (!divisionInfo) {
    // Try to match by number range
    const rangeMatch = filePrefix.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      if (start <= 100) divisionInfo = FILE_TO_DIVISION['1-100'];
      else if (start <= 200) divisionInfo = FILE_TO_DIVISION['101-200'];
      else if (start <= 300) divisionInfo = FILE_TO_DIVISION['201-300'];
      else if (start <= 400) divisionInfo = FILE_TO_DIVISION['301-400'];
      else if (start <= 500) divisionInfo = FILE_TO_DIVISION['401-500'];
      else if (start <= 600) divisionInfo = FILE_TO_DIVISION['501-600'];
      else divisionInfo = { code: '99', name: 'Other', title: 'Other Construction' };
    }
  }
  
  console.log(`Processing file: ${filePath}`);
  console.log(`Division: ${divisionInfo?.code} - ${divisionInfo?.name}`);
  
  // Read and parse JSON
  let jsonData: JSONExport;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    errors.push(`Failed to parse JSON file: ${filePath}`);
    return { stats, errors };
  }
  
  // Ensure division exists
  let division = await prisma.division.findFirst({
    where: { divisionCode: divisionInfo?.code || '99' },
  });
  
  if (!division && divisionInfo) {
    division = await prisma.division.create({
      data: {
        divisionCode: divisionInfo.code,
        divisionName: divisionInfo.name,
        divisionTitle: divisionInfo.title,
        sortOrder: parseInt(divisionInfo.code) || 99,
      },
    });
    console.log(`Created division: ${division.divisionCode} - ${division.divisionName}`);
  }
  
  // Ensure category exists
  let category = await prisma.category.findFirst({
    where: {
      divisionId: division?.id,
      categoryName: divisionInfo?.name || 'General',
    },
  });
  
  if (!category && division) {
    category = await prisma.category.create({
      data: {
        divisionId: division.id,
        categoryName: divisionInfo?.name || 'General',
        description: divisionInfo?.title,
        sortOrder: 1,
      },
    });
    console.log(`Created category: ${category.categoryName}`);
  }
  
  // Track unique units and labor codes seen
  const seenUnits = new Set<string>();
  const seenLaborCodes = new Set<string>();
  
  // Handle both formats: with runs object or direct pages array
  let runsToProcess: { fileName: string; pages: OCRPage[] }[] = [];
  
  if (jsonData.runs && typeof jsonData.runs === 'object') {
    // Format 1: Has runs object
    runsToProcess = Object.values(jsonData.runs);
  } else if ((jsonData as unknown as { pages?: OCRPage[] }).pages) {
    // Format 2: Has direct pages array (like 501-600.json.txt)
    runsToProcess = [{
      fileName: `${filePrefix}.pdf`,
      pages: (jsonData as unknown as { pages: OCRPage[] }).pages,
    }];
  } else if ((jsonData as unknown as { fileId?: string; pages?: OCRPage[] }).fileId) {
    // Format 3: Single run object
    const singleRun = jsonData as unknown as { fileId: string; fileName?: string; pages: OCRPage[] };
    runsToProcess = [{
      fileName: singleRun.fileName || `${filePrefix}.pdf`,
      pages: singleRun.pages,
    }];
  }
  
  // Process all runs in the file
  for (const run of runsToProcess) {
    console.log(`Processing run: ${run.fileName}`);
    
    let currentWorkItemName = path.basename(run.fileName, '.pdf');
    let currentSectionDescription = '';
    
    // Create a work item for this file
    let workItem = await prisma.workItem.findFirst({
      where: {
        categoryId: category?.id,
        workItemName: currentWorkItemName,
      },
    });
    
    if (!workItem && category) {
      workItem = await prisma.workItem.create({
        data: {
          categoryId: category.id,
          workItemName: currentWorkItemName,
          workItemType: 'assembly',
          sourcePublication: 'National Construction Estimator',
          sourceYear: 2024,
          scopeNotes: `Imported from ${run.fileName}`,
        },
      });
      stats.workItems++;
      console.log(`Created work item: ${workItem.workItemName}`);
    }
    
    // Process each page
    for (const page of run.pages) {
      for (const table of page.tables) {
        for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
          const row = table.rows[rowIndex];
          
          if (row.length < 6) continue;
          
          const [description, craftStr, unitStr, materialStr, laborStr, totalStr] = row;
          
          // Check if this is a section header
          if (isSectionHeader(row)) {
            currentSectionDescription = extractSectionDescription(row);
            continue;
          }
          
          // Skip rows without valid descriptions
          if (!description || description.trim() === '') continue;
          
          // Parse craft code
          const craftInfo = parseCraftCode(craftStr);
          
          // Ensure unit exists
          const unitCode = unitStr?.trim().toUpperCase() || 'EA';
          if (!seenUnits.has(unitCode)) {
            seenUnits.add(unitCode);
            
            const existingUnit = await prisma.unit.findUnique({
              where: { unitCode },
            });
            
            if (!existingUnit && UNIT_DEFINITIONS[unitCode]) {
              await prisma.unit.create({
                data: {
                  unitCode,
                  unitName: UNIT_DEFINITIONS[unitCode].name,
                  description: UNIT_DEFINITIONS[unitCode].description,
                },
              });
              stats.units++;
            } else if (!existingUnit) {
              // Create with generic info
              await prisma.unit.create({
                data: {
                  unitCode,
                  unitName: unitCode,
                  description: `Unit: ${unitCode}`,
                },
              });
              stats.units++;
            }
          }
          
          // Ensure labor code exists
          if (craftInfo && !seenLaborCodes.has(craftInfo.code)) {
            seenLaborCodes.add(craftInfo.code);
            
            const existingLaborCode = await prisma.laborCode.findUnique({
              where: { laborCode: craftInfo.code },
            });
            
            if (!existingLaborCode && CRAFT_CODES[craftInfo.code]) {
              await prisma.laborCode.create({
                data: {
                  laborCode: craftInfo.code,
                  codeName: CRAFT_CODES[craftInfo.code].name,
                  baseHourlyRate: CRAFT_CODES[craftInfo.code].rate,
                  isCrew: false,
                },
              });
              stats.laborCodes++;
            } else if (!existingLaborCode) {
              // Create with generic info
              await prisma.laborCode.create({
                data: {
                  laborCode: craftInfo.code,
                  codeName: `Craft ${craftInfo.code}`,
                  baseHourlyRate: craftInfo.hours > 0 ? 35.0 : null,
                  isCrew: false,
                },
              });
              stats.laborCodes++;
            }
          }
          
          // Parse costs
          const materialCost = parseCost(materialStr);
          const laborCost = parseCost(laborStr);
          const totalCost = parseCost(totalStr);
          
          // Create line item
          const lineItemId = generateLineItemId(filePrefix, page.page, rowIndex);
          
          // Check if line item already exists
          const existingLineItem = await prisma.lineItem.findUnique({
            where: { id: lineItemId },
          });
          
          if (!existingLineItem) {
            // Get unit and labor code IDs
            const unit = await prisma.unit.findUnique({
              where: { unitCode },
            });
            
            const laborCode = craftInfo
              ? await prisma.laborCode.findUnique({
                  where: { laborCode: craftInfo.code },
                })
              : null;
            
            await prisma.lineItem.create({
              data: {
                id: lineItemId,
                workItemId: workItem?.id || null,
                description: currentSectionDescription
                  ? `${currentSectionDescription} - ${description}`
                  : description,
                unitId: unit?.id || null,
                laborCodeId: laborCode?.id || null,
                laborHours: craftInfo?.hours || null,
                materialCost,
                laborCost,
                equipmentCost: 0,
                totalCost: totalCost || materialCost + laborCost,
                isActive: true,
              },
            });
            stats.lineItems++;
          }
        }
      }
    }
  }
  
  return { stats, errors };
}

// Main import function
async function importEstimatingData(uploadDir: string) {
  console.log('Starting import of estimating data...');
  console.log(`Upload directory: ${uploadDir}`);
  
  const overallStats = {
    filesProcessed: 0,
    totalUnits: 0,
    totalLaborCodes: 0,
    totalLineItems: 0,
    totalWorkItems: 0,
    errors: [] as string[],
  };
  
  // Find all JSON files in the upload directory
  const files = fs.readdirSync(uploadDir)
    .filter(f => f.endsWith('.json.txt'))
    .map(f => path.join(uploadDir, f));
  
  console.log(`Found ${files.length} JSON files to process`);
  
  for (const file of files) {
    try {
      const { stats, errors } = await processJsonFile(file);
      overallStats.filesProcessed++;
      overallStats.totalUnits += stats.units;
      overallStats.totalLaborCodes += stats.laborCodes;
      overallStats.totalLineItems += stats.lineItems;
      overallStats.totalWorkItems += stats.workItems;
      overallStats.errors.push(...errors);
    } catch (error) {
      overallStats.errors.push(`Error processing ${file}: ${error}`);
    }
  }
  
  console.log('\n=== Import Summary ===');
  console.log(`Files processed: ${overallStats.filesProcessed}`);
  console.log(`Units created: ${overallStats.totalUnits}`);
  console.log(`Labor codes created: ${overallStats.totalLaborCodes}`);
  console.log(`Work items created: ${overallStats.totalWorkItems}`);
  console.log(`Line items created: ${overallStats.totalLineItems}`);
  console.log(`Errors: ${overallStats.errors.length}`);
  
  if (overallStats.errors.length > 0) {
    console.log('\nErrors:');
    overallStats.errors.forEach(e => console.log(`  - ${e}`));
  }
  
  return overallStats;
}

// Run the import
const uploadDir = process.argv[2] || '/home/z/my-project/upload';

importEstimatingData(uploadDir)
  .then(() => {
    console.log('\nImport completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
