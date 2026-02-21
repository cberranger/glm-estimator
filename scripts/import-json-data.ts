/**
 * Import JSON Cost Data from ./db/json directory
 * Parses OCR'd cost book data and imports into hierarchical structure
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface JsonPage {
  page: number;
  tables: Array<{
    headers: string[];
    rows: string[][];
  }>;
}

interface JsonFileRun {
  fileId: string;
  fileName: string;
  pages: JsonPage[];
}

interface JsonFile {
  exportedAt: string;
  totalFiles: number;
  runs: Record<string, JsonFileRun>;
}

// CSI Division mapping based on common patterns in construction cost books
const DIVISION_PATTERNS: Record<string, { code: string; name: string }> = {
  // Division 02 - Existing Conditions
  'demolition': { code: '02', name: 'Demolition' },
  'removal': { code: '02', name: 'Removal' },
  'excavation': { code: '31', name: 'Earthwork' },
  'dozer': { code: '31', name: 'Earthwork' },
  'loader': { code: '31', name: 'Earthwork' },
  
  // Division 03 - Concrete
  'concrete': { code: '03', name: 'Concrete' },
  
  // Division 04 - Masonry
  'masonry': { code: '04', name: 'Masonry' },
  'brick': { code: '04', name: 'Masonry' },
  
  // Division 05 - Metals
  'steel': { code: '05', name: 'Metals' },
  'metal': { code: '05', name: 'Metals' },
  
  // Division 06 - Wood
  'lumber': { code: '06', name: 'Wood, Plastics & Composites' },
  'wood': { code: '06', name: 'Wood, Plastics & Composites' },
  'timber': { code: '06', name: 'Wood, Plastics & Composites' },
  'plywood': { code: '06', name: 'Wood, Plastics & Composites' },
  
  // Division 07 - Thermal & Moisture
  'insulation': { code: '07', name: 'Thermal & Moisture Protection' },
  'roofing': { code: '07', name: 'Thermal & Moisture Protection' },
  'waterproofing': { code: '07', name: 'Thermal & Moisture Protection' },
  'siding': { code: '07', name: 'Thermal & Moisture Protection' },
  'built-up': { code: '07', name: 'Thermal & Moisture Protection' },
  'epdm': { code: '07', name: 'Thermal & Moisture Protection' },
  'elastomeric': { code: '07', name: 'Thermal & Moisture Protection' },
  
  // Division 08 - Openings
  'door': { code: '08', name: 'Openings' },
  'window': { code: '08', name: 'Openings' },
  'glazing': { code: '08', name: 'Openings' },
  
  // Division 09 - Finishes
  'drywall': { code: '09', name: 'Finishes' },
  'gypsum': { code: '09', name: 'Finishes' },
  'tile': { code: '09', name: 'Finishes' },
  'flooring': { code: '09', name: 'Finishes' },
  'paint': { code: '09', name: 'Finishes' },
  'ceiling': { code: '09', name: 'Finishes' },
  'carpet': { code: '09', name: 'Finishes' },
  'plaster': { code: '09', name: 'Finishes' },
  'hardwood': { code: '09', name: 'Finishes' },
  'vinyl': { code: '09', name: 'Finishes' },
  'laminate': { code: '09', name: 'Finishes' },
  
  // Division 22 - Plumbing
  'plumbing': { code: '22', name: 'Plumbing' },
  'pipe': { code: '22', name: 'Plumbing' },
  
  // Division 23 - HVAC
  'hvac': { code: '23', name: 'HVAC' },
  'duct': { code: '23', name: 'HVAC' },
  
  // Division 26 - Electrical
  'electrical': { code: '26', name: 'Electrical' },
  'wire': { code: '26', name: 'Electrical' },
};

// Map to track created categories
const categoryCache = new Map<string, string>();
const divisionCache = new Map<string, string>();
const unitCache = new Map<string, string>();
const laborCodeCache = new Map<string, string>();

// Parse cost value from string
function parseCost(value: string): number {
  if (!value || value === '—' || value === '-') return 0;
  const cleaned = value.replace(/[$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Parse labor hours from craft code (e.g., "B1@.510" -> 0.51 hours)
function parseLaborHours(craftCode: string): number | null {
  if (!craftCode || craftCode === '—') return null;
  const match = craftCode.match(/@([\d.]+)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

// Extract labor code from craft code (e.g., "B1@.510" -> "B1")
function extractLaborCode(craftCode: string): string | null {
  if (!craftCode || craftCode === '—') return null;
  const match = craftCode.match(/^([A-Z0-9]+)@/);
  return match ? match[1] : null;
}

// Detect division from content
function detectDivision(content: string): { code: string; name: string } {
  const lower = content.toLowerCase();
  
  for (const [pattern, division] of Object.entries(DIVISION_PATTERNS)) {
    if (lower.includes(pattern)) {
      return division;
    }
  }
  
  // Default to Division 09 (Finishes) for most items
  return { code: '09', name: 'Finishes' };
}

// Get or create division
async function getOrCreateDivision(code: string, name: string): Promise<string> {
  const key = code;
  
  if (divisionCache.has(key)) {
    return divisionCache.get(key)!;
  }
  
  let division = await prisma.division.findUnique({
    where: { divisionCode: code }
  });
  
  if (!division) {
    division = await prisma.division.create({
      data: {
        divisionCode: code,
        divisionName: name,
        sortOrder: parseInt(code) || 99,
      }
    });
  }
  
  divisionCache.set(key, division.id);
  return division.id;
}

// Get or create unit
async function getOrCreateUnit(unitCode: string): Promise<string | null> {
  if (!unitCode || unitCode === '—') return null;
  
  const normalized = unitCode.toUpperCase().trim();
  
  if (unitCache.has(normalized)) {
    return unitCache.get(normalized)!;
  }
  
  let unit = await prisma.unit.findUnique({
    where: { unitCode: normalized }
  });
  
  if (!unit) {
    const unitNames: Record<string, string> = {
      'SF': 'Square Foot',
      'SY': 'Square Yard',
      'LF': 'Linear Foot',
      'EA': 'Each',
      'Ea': 'Each',
      'CY': 'Cubic Yard',
      'CF': 'Cubic Foot',
      'GAL': 'Gallon',
      'Gal': 'Gallon',
      'LB': 'Pound',
      'SQ': 'Square (100 SF)',
      'Sq': 'Square (100 SF)',
      'CSF': 'Hundred Square Feet',
      'CLF': 'Hundred Linear Feet',
      'MBF': 'Thousand Board Feet',
      'HR': 'Hour',
      '%': 'Percentage',
    };
    
    unit = await prisma.unit.create({
      data: {
        unitCode: normalized,
        unitName: unitNames[normalized] || normalized,
      }
    });
  }
  
  unitCache.set(normalized, unit.id);
  return unit.id;
}

// Get or create labor code
async function getOrCreateLaborCode(code: string): Promise<string | null> {
  if (!code) return null;
  
  if (laborCodeCache.has(code)) {
    return laborCodeCache.get(code)!;
  }
  
  let laborCode = await prisma.laborCode.findUnique({
    where: { laborCode: code }
  });
  
  if (!laborCode) {
    laborCode = await prisma.laborCode.create({
      data: {
        laborCode: code,
        codeName: `Labor Code ${code}`,
        isCrew: code.length > 2,
      }
    });
  }
  
  laborCodeCache.set(code, laborCode.id);
  return laborCode.id;
}

// Get or create category
async function getOrCreateCategory(
  divisionId: string,
  categoryName: string,
  parentCategoryId?: string
): Promise<string> {
  const key = `${divisionId}:${categoryName}:${parentCategoryId || 'root'}`;
  
  if (categoryCache.has(key)) {
    return categoryCache.get(key)!;
  }
  
  let category = await prisma.category.findFirst({
    where: {
      divisionId,
      categoryName,
      parentCategoryId: parentCategoryId || null,
    }
  });
  
  if (!category) {
    category = await prisma.category.create({
      data: {
        divisionId,
        categoryName,
        parentCategoryId,
      }
    });
  }
  
  categoryCache.set(key, category.id);
  return category.id;
}

// Process a single table
async function processTable(
  table: { headers: string[]; rows: string[][] },
  fileName: string
): Promise<number> {
  let itemsCreated = 0;
  
  // Track current context
  let currentDivisionId: string | null = null;
  let currentCategoryId: string | null = null;
  let currentWorkItemId: string | null = null;
  
  // Detect initial division from filename
  const fileNameLower = fileName.toLowerCase();
  let initialDivision = detectDivision(fileNameLower);
  currentDivisionId = await getOrCreateDivision(initialDivision.code, initialDivision.name);
  
  for (const row of table.rows) {
    const description = row[0]?.trim() || '';
    
    // Skip empty rows
    if (!description) continue;
    
    // Detect if this is a section header (single column with content, rest empty or dashes)
    const nonEmptyColumns = row.filter((c, i) => i > 0 && c && c !== '—' && c.trim() !== '');
    const isSectionHeader = description && nonEmptyColumns.length === 0;
    
    if (isSectionHeader) {
      // This is a category/section header
      // Detect division from content
      const detectedDivision = detectDivision(description);
      
      if (detectedDivision.code !== initialDivision.code) {
        currentDivisionId = await getOrCreateDivision(detectedDivision.code, detectedDivision.name);
      }
      
      // Create category
      if (currentDivisionId) {
        // Create as top-level category
        currentCategoryId = await getOrCreateCategory(
          currentDivisionId,
          description.substring(0, 200) // Truncate long descriptions
        );
        
        // Create work item for this category
        currentWorkItemId = await prisma.workItem.create({
          data: {
            categoryId: currentCategoryId,
            workItemName: description.substring(0, 200),
            workItemType: 'task',
            sourcePublication: 'National Construction Estimator',
            sourceYear: 2024,
          }
        }).then(w => w.id).catch(() => null);
      }
    } else if (currentWorkItemId && currentDivisionId) {
      // This is a data row - parse it
      const craftHrs = row[1] || '';
      const unit = row[2] || '';
      const material = row[3] || '0';
      const labor = row[4] || '0';
      const equipment = row[5] || '0';
      const total = row[6] || '0';
      
      // Skip percentage adjustments
      if (unit === '%') continue;
      
      // Skip rows that are just headers
      if (description === 'Craft@Hrs' || description === 'Unit') continue;
      
      const materialCost = parseCost(material);
      const laborCost = parseCost(labor);
      const equipmentCost = parseCost(equipment);
      const totalCost = parseCost(total);
      const laborHours = parseLaborHours(craftHrs);
      const laborCodeStr = extractLaborCode(craftHrs);
      
      // Get unit and labor code
      const unitId = await getOrCreateUnit(unit);
      const laborCodeId = laborCodeStr ? await getOrCreateLaborCode(laborCodeStr) : null;
      
      // Create line item
      try {
        await prisma.lineItem.create({
          data: {
            workItemId: currentWorkItemId,
            description: description.substring(0, 500),
            unitId,
            laborCodeId,
            laborHours,
            materialCost,
            laborCost,
            equipmentCost,
            totalCost: totalCost || (materialCost + laborCost + equipmentCost),
          }
        });
        itemsCreated++;
      } catch (e) {
        // Skip duplicates or errors
      }
    }
  }
  
  return itemsCreated;
}

// Main import function
async function main() {
  console.log('Starting JSON data import...');
  console.log('');
  
  const jsonDir = path.join(process.cwd(), 'db', 'json');
  
  if (!fs.existsSync(jsonDir)) {
    console.error('Error: ./db/json directory not found');
    process.exit(1);
  }
  
  const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.error('Error: No JSON files found in ./db/json');
    process.exit(1);
  }
  
  console.log(`Found ${files.length} JSON files to import:`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log('');
  
  let totalItems = 0;
  
  for (const file of files) {
    console.log(`Processing ${file}...`);
    
    const filePath = path.join(jsonDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data: JsonFile = JSON.parse(content);
    
    // Process each run in the file
    for (const runId of Object.keys(data.runs || {})) {
      const run = data.runs[runId];
      console.log(`  Run: ${run.fileName || runId}`);
      
      for (const page of run.pages || []) {
        for (const table of page.tables || []) {
          const items = await processTable(table, run.fileName || file);
          totalItems += items;
        }
      }
    }
    
    console.log(`  ✓ Completed ${file}`);
  }
  
  console.log('');
  console.log('Import complete!');
  console.log(`  Total line items created: ${totalItems}`);
  
  // Show summary
  const divisions = await prisma.division.count();
  const categories = await prisma.category.count();
  const workItems = await prisma.workItem.count();
  const lineItems = await prisma.lineItem.count();
  const laborCodes = await prisma.laborCode.count();
  const units = await prisma.unit.count();
  
  console.log('');
  console.log('Database Summary:');
  console.log(`  Divisions: ${divisions}`);
  console.log(`  Categories: ${categories}`);
  console.log(`  Work Items: ${workItems}`);
  console.log(`  Line Items: ${lineItems}`);
  console.log(`  Labor Codes: ${laborCodes}`);
  console.log(`  Units: ${units}`);
}

main()
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
