import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.estimateLineItem.deleteMany();
  await prisma.lineItemVariantCost.deleteMany();
  await prisma.specification.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.room.deleteMany();
  await prisma.project.deleteMany();
  await prisma.lineItem.deleteMany();
  await prisma.materialVariant.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.division.deleteMany();
  await prisma.laborCode.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.areaModifier.deleteMany();

  console.log('Seeding CSI MasterFormat database...');

  // ============================================
  // UNITS OF MEASUREMENT
  // ============================================
  // Create base units first (no dependencies)
  const unitSF = await prisma.unit.create({ data: { unitCode: 'SF', unitName: 'Square Foot', description: 'Square feet area' } });
  const unitLF = await prisma.unit.create({ data: { unitCode: 'LF', unitName: 'Linear Foot', description: 'Linear feet length' } });
  const unitCY = await prisma.unit.create({ data: { unitCode: 'CY', unitName: 'Cubic Yard', description: 'Cubic yards volume' } });
  const unitCF = await prisma.unit.create({ data: { unitCode: 'CF', unitName: 'Cubic Foot', description: 'Cubic feet volume', conversionFactorToBase: 0.037, baseUnit: 'CY' } });
  const unitEA = await prisma.unit.create({ data: { unitCode: 'EA', unitName: 'Each', description: 'Individual unit' } });
  const unitHR = await prisma.unit.create({ data: { unitCode: 'HR', unitName: 'Hour', description: 'Labor hours' } });
  const unitDAY = await prisma.unit.create({ data: { unitCode: 'DAY', unitName: 'Day', description: 'Work days', conversionFactorToBase: 8, baseUnit: 'HR' } });
  const unitLB = await prisma.unit.create({ data: { unitCode: 'LB', unitName: 'Pound', description: 'Weight in pounds' } });
  const unitTON = await prisma.unit.create({ data: { unitCode: 'TON', unitName: 'Ton', description: 'Weight in tons', conversionFactorToBase: 2000, baseUnit: 'LB' } });
  const unitGAL = await prisma.unit.create({ data: { unitCode: 'GAL', unitName: 'Gallon', description: 'Liquid gallons' } });
  const unitSQ = await prisma.unit.create({ data: { unitCode: 'SQ', unitName: 'Square', description: '100 square feet (roofing)', conversionFactorToBase: 100, baseUnit: 'SF' } });
  const unitMBF = await prisma.unit.create({ data: { unitCode: 'MBF', unitName: 'Thousand Board Feet', description: 'Lumber measurement' } });
  const unitLN = await prisma.unit.create({ data: { unitCode: 'LN', unitName: 'Lane Mile', description: 'Road measurement' } });
  const unitLS = await prisma.unit.create({ data: { unitCode: 'LS', unitName: 'Lump Sum', description: 'Fixed price item' } });
  const unitSY = await prisma.unit.create({ data: { unitCode: 'SY', unitName: 'Square Yard', description: 'Square yards area', conversionFactorToBase: 9, baseUnit: 'SF' } });

  const units = [unitSF, unitLF, unitCY, unitCF, unitEA, unitHR, unitDAY, unitLB, unitTON, unitGAL, unitSQ, unitMBF, unitLN, unitLS, unitSY];
  console.log(`Created ${units.length} units`);

  // Helper to find unit ID by code
  const getUnitId = (code: string): string | null => {
    const unit = units.find(u => u.unitCode === code);
    return unit?.id || null;
  };

  // ============================================
  // LABOR CODES - Trade Classifications
  // ============================================
  const laborCodes = await Promise.all([
    // Individual Trades
    prisma.laborCode.create({ data: { laborCode: 'CARP-01', codeName: 'Carpenter Journeyman', description: 'Skilled carpenter', baseHourlyRate: 45.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'CARP-02', codeName: 'Carpenter Apprentice', description: 'Carpenter apprentice', baseHourlyRate: 28.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'ELEC-01', codeName: 'Electrician Journeyman', description: 'Licensed electrician', baseHourlyRate: 52.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'ELEC-02', codeName: 'Electrician Apprentice', description: 'Electrician apprentice', baseHourlyRate: 32.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'PLMB-01', codeName: 'Plumber Journeyman', description: 'Licensed plumber', baseHourlyRate: 55.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'PLMB-02', codeName: 'Plumber Apprentice', description: 'Plumber apprentice', baseHourlyRate: 34.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'HVAC-01', codeName: 'HVAC Technician', description: 'HVAC certified technician', baseHourlyRate: 50.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'MASN-01', codeName: 'Mason', description: 'Brick/stone mason', baseHourlyRate: 48.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'PAIN-01', codeName: 'Painter', description: 'Professional painter', baseHourlyRate: 38.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'ROOF-01', codeName: 'Roofer', description: 'Roofing specialist', baseHourlyRate: 42.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'FLOR-01', codeName: 'Flooring Installer', description: 'Flooring specialist', baseHourlyRate: 40.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'DRYW-01', codeName: 'Drywaller', description: 'Drywall installer/finisher', baseHourlyRate: 36.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'IRON-01', codeName: 'Ironworker', description: 'Structural steel worker', baseHourlyRate: 50.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'LAB-01', codeName: 'General Laborer', description: 'General construction labor', baseHourlyRate: 25.00, isCrew: false } }),
    prisma.laborCode.create({ data: { laborCode: 'EQUIP-01', codeName: 'Equipment Operator', description: 'Heavy equipment operator', baseHourlyRate: 45.00, isCrew: false } }),
    
    // Crews
    prisma.laborCode.create({ data: { laborCode: 'CREW-FRAM', codeName: 'Framing Crew', description: '2 carpenters + 1 apprentice', baseHourlyRate: 118.00, isCrew: true } }),
    prisma.laborCode.create({ data: { laborCode: 'CREW-DRYW', codeName: 'Drywall Crew', description: '2 drywallers + 1 laborer', baseHourlyRate: 97.00, isCrew: true } }),
    prisma.laborCode.create({ data: { laborCode: 'CREW-ROOF', codeName: 'Roofing Crew', description: '3 roofers + 1 laborer', baseHourlyRate: 151.00, isCrew: true } }),
    prisma.laborCode.create({ data: { laborCode: 'CREW-FLOR', codeName: 'Flooring Crew', description: '2 flooring installers', baseHourlyRate: 80.00, isCrew: true } }),
    prisma.laborCode.create({ data: { laborCode: 'CREW-PAIN', codeName: 'Painting Crew', description: '2 painters', baseHourlyRate: 76.00, isCrew: true } }),
    prisma.laborCode.create({ data: { laborCode: 'CREW-MASN', codeName: 'Masonry Crew', description: '2 masons + 1 laborer', baseHourlyRate: 121.00, isCrew: true } }),
    prisma.laborCode.create({ data: { laborCode: 'CREW-EXCA', codeName: 'Excavation Crew', description: '1 operator + 2 laborers', baseHourlyRate: 95.00, isCrew: true } }),
    prisma.laborCode.create({ data: { laborCode: 'CREW-CONC', codeName: 'Concrete Crew', description: '4 laborers + 1 finisher', baseHourlyRate: 145.00, isCrew: true } }),
  ]);
  console.log(`Created ${laborCodes.length} labor codes`);

  // Helper to find labor code ID by code
  const getLaborCodeId = (code: string): string | null => {
    const lc = laborCodes.find(l => l.laborCode === code);
    return lc?.id || null;
  };

  // ============================================
  // MATERIAL VARIANTS
  // ============================================
  const variants = await Promise.all([
    prisma.materialVariant.create({ data: { variantName: 'Economy', description: 'Budget-grade materials', sortOrder: 1 } }),
    prisma.materialVariant.create({ data: { variantName: 'Standard', description: 'Standard-grade materials', sortOrder: 2 } }),
    prisma.materialVariant.create({ data: { variantName: 'Premium', description: 'Premium-grade materials', sortOrder: 3 } }),
    prisma.materialVariant.create({ data: { variantName: 'Commercial', description: 'Commercial-grade materials', sortOrder: 4 } }),
    prisma.materialVariant.create({ data: { variantName: 'Industrial', description: 'Industrial-grade materials', sortOrder: 5 } }),
  ]);
  console.log(`Created ${variants.length} material variants`);

  // ============================================
  // CSI MASTERFORMAT DIVISIONS
  // ============================================
  const divisionsData = [
    { divisionCode: '01', divisionName: 'General Requirements', divisionTitle: 'Project management, supervision, temporary facilities' },
    { divisionCode: '02', divisionName: 'Existing Conditions', divisionTitle: 'Demolition, site assessment, remediation' },
    { divisionCode: '03', divisionName: 'Concrete', divisionTitle: 'Cast-in-place concrete, precast, reinforcing' },
    { divisionCode: '04', divisionName: 'Masonry', divisionTitle: 'Brick, block, stone, masonry restoration' },
    { divisionCode: '05', divisionName: 'Metals', divisionTitle: 'Structural steel, metal framing, joists, decking' },
    { divisionCode: '06', divisionName: 'Wood, Plastics & Composites', divisionTitle: 'Rough carpentry, finish carpentry, millwork' },
    { divisionCode: '07', divisionName: 'Thermal & Moisture Protection', divisionTitle: 'Insulation, roofing, waterproofing, siding' },
    { divisionCode: '08', divisionName: 'Openings', divisionTitle: 'Doors, windows, storefronts, glazing' },
    { divisionCode: '09', divisionName: 'Finishes', divisionTitle: 'Drywall, flooring, painting, ceilings' },
    { divisionCode: '10', divisionName: 'Specialties', divisionTitle: 'Specialty items, signage, lockers' },
    { divisionCode: '11', divisionName: 'Equipment', divisionTitle: 'Kitchen equipment, laboratory equipment' },
    { divisionCode: '12', divisionName: 'Furnishings', divisionTitle: 'Cabinets, casework, furniture' },
    { divisionCode: '13', divisionName: 'Special Construction', divisionTitle: 'Special structures, integrated systems' },
    { divisionCode: '14', divisionName: 'Conveying Equipment', divisionTitle: 'Elevators, escalators, lifts' },
    { divisionCode: '21', divisionName: 'Fire Suppression', divisionTitle: 'Sprinklers, fire extinguishers' },
    { divisionCode: '22', divisionName: 'Plumbing', divisionTitle: 'Piping, fixtures, water heating' },
    { divisionCode: '23', divisionName: 'HVAC', divisionTitle: 'Heating, ventilation, air conditioning' },
    { divisionCode: '26', divisionName: 'Electrical', divisionTitle: 'Electrical service, distribution, lighting' },
    { divisionCode: '27', divisionName: 'Communications', divisionTitle: 'Data, voice, video systems' },
    { divisionCode: '28', divisionName: 'Electronic Safety & Security', divisionTitle: 'Access control, surveillance, detection' },
    { divisionCode: '31', divisionName: 'Earthwork', divisionTitle: 'Excavation, grading, foundations' },
    { divisionCode: '32', divisionName: 'Exterior Improvements', divisionTitle: 'Paving, landscaping, site furnishings' },
    { divisionCode: '33', divisionName: 'Utilities', divisionTitle: 'Underground utilities, sewer, water' },
  ];

  const divisions = await Promise.all(
    divisionsData.map((d, i) => prisma.division.create({
      data: { ...d, sortOrder: i }
    }))
  );
  console.log(`Created ${divisions.length} CSI divisions`);

  // ============================================
  // CATEGORIES AND WORK ITEMS
  // ============================================
  const categoryCount = { count: 0 };
  const workItemCount = { count: 0 };
  const lineItemCount = { count: 0 };

  // Helper to create category
  const createCategory = async (divisionId: string, name: string, sortOrder: number, description?: string) => {
    categoryCount.count++;
    return prisma.category.create({
      data: { divisionId, categoryName: name, sortOrder, description }
    });
  };

  // Helper to create work item
  const createWorkItem = async (categoryId: string, name: string, type: string, notes?: string) => {
    workItemCount.count++;
    return prisma.workItem.create({
      data: { categoryId, workItemName: name, workItemType: type, scopeNotes: notes }
    });
  };

  // Helper to create line item with variants
  const createLineItemWithVariants = async (
    workItemId: string,
    description: string,
    unitCode: string,
    laborCodeStr: string | null,
    laborHours: number,
    materialCosts: number[], // [economy, standard, premium, commercial, industrial]
    laborCost: number,
    equipmentCost: number = 0
  ) => {
    const avgMaterial = materialCosts.reduce((a, b) => a + b, 0) / materialCosts.length;
    const totalCost = avgMaterial + laborCost + equipmentCost;
    const unitId = getUnitId(unitCode);
    const laborCodeId = laborCodeStr ? getLaborCodeId(laborCodeStr) : null;
    
    const lineItem = await prisma.lineItem.create({
      data: {
        workItemId,
        description,
        unitId,
        laborCodeId,
        laborHours,
        materialCost: avgMaterial,
        laborCost,
        equipmentCost,
        totalCost,
      }
    });
    
    // Create variant costs
    for (let i = 0; i < materialCosts.length; i++) {
      const variantMat = materialCosts[i];
      const total = variantMat + laborCost + equipmentCost;
      await prisma.lineItemVariantCost.create({
        data: {
          lineItemId: lineItem.id,
          variantId: variants[i].id,
          materialCost: variantMat,
          laborCost,
          equipmentCost,
          totalCost: total,
        }
      });
    }
    
    lineItemCount.count++;
    return lineItem;
  };

  // ============================================
  // DIVISION 01 - GENERAL REQUIREMENTS
  // ============================================
  const div01 = divisions.find(d => d.divisionCode === '01')!;
  const cat01_01 = await createCategory(div01.id, 'Project Management', 1);
  const cat01_02 = await createCategory(div01.id, 'Construction Facilities', 2);
  const cat01_03 = await createCategory(div01.id, 'Temporary Utilities', 3);

  const wi01_01 = await createWorkItem(cat01_01.id, 'Project Superintendent', 'task', 'Full-time on-site supervision');
  await createLineItemWithVariants(wi01_01.id, 'Project Superintendent - Daily Supervision', 'DAY', null, 0, [0, 0, 0, 0, 0], 650, 0);

  const wi01_02 = await createWorkItem(cat01_02.id, 'Temporary Office', 'assembly', 'Field office with utilities');
  await createLineItemWithVariants(wi01_02.id, 'Temporary Office Trailer (8x40) - Monthly', 'LS', null, 0, [1200, 1500, 1800, 1500, 2000], 0, 0);

  const wi01_03 = await createWorkItem(cat01_03.id, 'Temporary Electricity', 'assembly', 'Temporary power connection');
  await createLineItemWithVariants(wi01_03.id, 'Temporary Electrical Service - Monthly', 'LS', null, 0, [350, 450, 550, 500, 650], 0, 100);

  // ============================================
  // DIVISION 02 - EXISTING CONDITIONS
  // ============================================
  const div02 = divisions.find(d => d.divisionCode === '02')!;
  const cat02_01 = await createCategory(div02.id, 'Demolition', 1);
  const cat02_02 = await createCategory(div02.id, 'Site Assessment', 2);

  const wi02_01 = await createWorkItem(cat02_01.id, 'Interior Demolition', 'task', 'Selective interior demo');
  await createLineItemWithVariants(wi02_01.id, 'Interior Demolition - Walls (wood frame)', 'SF', 'LAB-01', 0.05, [0.25, 0.35, 0.45, 0.35, 0.50], 1.50, 0);
  await createLineItemWithVariants(wi02_01.id, 'Interior Demolition - Walls (load bearing)', 'SF', 'LAB-01', 0.08, [0.50, 0.75, 1.00, 0.75, 1.25], 2.50, 0.50);
  await createLineItemWithVariants(wi02_01.id, 'Interior Demolition - Floor Covering', 'SF', 'LAB-01', 0.03, [0.15, 0.20, 0.25, 0.20, 0.30], 0.85, 0);
  await createLineItemWithVariants(wi02_01.id, 'Interior Demolition - Ceiling (drywall)', 'SF', 'LAB-01', 0.04, [0.20, 0.30, 0.40, 0.30, 0.45], 1.25, 0);
  await createLineItemWithVariants(wi02_01.id, 'Remove Kitchen Cabinets', 'LF', 'CARP-02', 0.25, [0.50, 0.75, 1.00, 0.75, 1.25], 8.50, 0);

  const wi02_02 = await createWorkItem(cat02_02.id, 'Hazardous Material Survey', 'task', 'Asbestos/lead testing');
  await createLineItemWithVariants(wi02_02.id, 'Asbestos Survey - Sampling', 'EA', null, 0, [45, 65, 85, 65, 95], 150, 0);
  await createLineItemWithVariants(wi02_02.id, 'Lead Paint Testing', 'EA', null, 0, [25, 35, 45, 35, 55], 75, 0);

  // ============================================
  // DIVISION 03 - CONCRETE
  // ============================================
  const div03 = divisions.find(d => d.divisionCode === '03')!;
  const cat03_01 = await createCategory(div03.id, 'Cast-in-Place Concrete', 1);
  const cat03_02 = await createCategory(div03.id, 'Concrete Reinforcing', 2);

  const wi03_01 = await createWorkItem(cat03_01.id, 'Formwork', 'assembly', 'Concrete forms');
  await createLineItemWithVariants(wi03_01.id, 'Formwork - Foundation Walls', 'SF', 'CREW-CONC', 0.15, [2.50, 3.25, 4.00, 3.50, 4.50], 4.50, 1.25);
  await createLineItemWithVariants(wi03_01.id, 'Formwork - Footings', 'SF', 'CREW-CONC', 0.12, [1.75, 2.25, 2.75, 2.50, 3.00], 3.75, 0.85);
  await createLineItemWithVariants(wi03_01.id, 'Formwork - Slab on Grade', 'SF', 'CREW-CONC', 0.08, [1.25, 1.65, 2.00, 1.75, 2.25], 2.50, 0.50);

  const wi03_02 = await createWorkItem(cat03_01.id, 'Concrete Placement', 'assembly', 'Pour and finish concrete');
  await createLineItemWithVariants(wi03_02.id, 'Concrete - Ready Mix (3000 PSI)', 'CY', null, 0, [125, 145, 165, 150, 180], 0, 0);
  await createLineItemWithVariants(wi03_02.id, 'Concrete - Ready Mix (4000 PSI)', 'CY', null, 0, [135, 155, 180, 165, 195], 0, 0);
  await createLineItemWithVariants(wi03_02.id, 'Concrete Placement - Slab', 'CY', 'CREW-CONC', 0.5, [0, 0, 0, 0, 0], 35, 15);
  await createLineItemWithVariants(wi03_02.id, 'Concrete Finish - Trowel', 'SF', 'CREW-CONC', 0.02, [0.50, 0.75, 1.00, 0.85, 1.25], 1.50, 0);
  await createLineItemWithVariants(wi03_02.id, 'Concrete Finish - Broom', 'SF', 'CREW-CONC', 0.01, [0.25, 0.35, 0.45, 0.35, 0.50], 0.75, 0);
  await createLineItemWithVariants(wi03_02.id, 'Concrete Curing Compound', 'SF', 'LAB-01', 0.005, [0.08, 0.12, 0.15, 0.12, 0.18], 0.15, 0);

  const wi03_03 = await createWorkItem(cat03_02.id, 'Reinforcing Steel', 'material', 'Rebar placement');
  await createLineItemWithVariants(wi03_03.id, 'Rebar - #4 (1/2 inch)', 'LB', null, 0, [0.85, 0.95, 1.05, 0.95, 1.15], 0, 0);
  await createLineItemWithVariants(wi03_03.id, 'Rebar - #5 (5/8 inch)', 'LB', null, 0, [0.90, 1.00, 1.10, 1.00, 1.20], 0, 0);
  await createLineItemWithVariants(wi03_03.id, 'Rebar Placement - Foundation', 'LB', 'IRON-01', 0.008, [0, 0, 0, 0, 0], 0.45, 0.05);
  await createLineItemWithVariants(wi03_03.id, 'Wire Mesh - 6x6 W1.4/W1.4', 'SF', null, 0, [0.28, 0.35, 0.42, 0.35, 0.48], 0, 0);
  await createLineItemWithVariants(wi03_03.id, 'Wire Mesh Placement', 'SF', 'LAB-01', 0.01, [0, 0, 0, 0, 0], 0.35, 0);

  // ============================================
  // DIVISION 04 - MASONRY
  // ============================================
  const div04 = divisions.find(d => d.divisionCode === '04')!;
  const cat04_01 = await createCategory(div04.id, 'Unit Masonry', 1);
  const cat04_02 = await createCategory(div04.id, 'Stone Masonry', 2);

  const wi04_01 = await createWorkItem(cat04_01.id, 'Concrete Block', 'assembly', 'CMU construction');
  await createLineItemWithVariants(wi04_01.id, 'Concrete Block - 8x8x16 Standard', 'EA', null, 0, [1.85, 2.25, 2.75, 2.50, 3.25], 0, 0);
  await createLineItemWithVariants(wi04_01.id, 'Concrete Block - 8x8x16 Split Face', 'EA', null, 0, [2.75, 3.35, 4.00, 3.75, 4.50], 0, 0);
  await createLineItemWithVariants(wi04_01.id, 'CMU Installation - Standard', 'SF', 'CREW-MASN', 0.15, [0, 0, 0, 0, 0], 8.50, 1.50);
  await createLineItemWithVariants(wi04_01.id, 'Mortar - Type S', 'CF', null, 0, [125, 145, 165, 150, 180], 0, 0);

  const wi04_02 = await createWorkItem(cat04_01.id, 'Brick', 'assembly', 'Brick construction');
  await createLineItemWithVariants(wi04_02.id, 'Brick - Standard Modular', 'EA', null, 0, [0.45, 0.65, 0.85, 0.75, 1.00], 0, 0);
  await createLineItemWithVariants(wi04_02.id, 'Brick - Face Brick Premium', 'EA', null, 0, [0.75, 1.05, 1.35, 1.15, 1.55], 0, 0);
  await createLineItemWithVariants(wi04_02.id, 'Brick Veneer Installation', 'SF', 'CREW-MASN', 0.25, [0, 0, 0, 0, 0], 12.50, 2.00);

  // ============================================
  // DIVISION 05 - METALS
  // ============================================
  const div05 = divisions.find(d => d.divisionCode === '05')!;
  const cat05_01 = await createCategory(div05.id, 'Structural Metal Framing', 1);
  const cat05_02 = await createCategory(div05.id, 'Metal Fabrications', 2);

  const wi05_01 = await createWorkItem(cat05_01.id, 'Steel Framing', 'assembly', 'Structural steel');
  await createLineItemWithVariants(wi05_01.id, 'Steel Beam - W8x18', 'LB', null, 0, [1.25, 1.45, 1.65, 1.55, 1.85], 0, 0);
  await createLineItemWithVariants(wi05_01.id, 'Steel Column - W6x15', 'LB', null, 0, [1.30, 1.50, 1.75, 1.60, 1.95], 0, 0);
  await createLineItemWithVariants(wi05_01.id, 'Steel Erection', 'LB', 'IRON-01', 0.015, [0, 0, 0, 0, 0], 0.85, 0.35);

  const wi05_02 = await createWorkItem(cat05_02.id, 'Metal Studs', 'assembly', 'Light gauge framing');
  await createLineItemWithVariants(wi05_02.id, 'Metal Studs - 3-5/8" 25 GA', 'LF', null, 0, [1.15, 1.45, 1.75, 1.55, 2.00], 0, 0);
  await createLineItemWithVariants(wi05_02.id, 'Metal Studs - 6" 20 GA', 'LF', null, 0, [1.85, 2.25, 2.75, 2.50, 3.00], 0, 0);
  await createLineItemWithVariants(wi05_02.id, 'Metal Track - 3-5/8" 25 GA', 'LF', null, 0, [0.85, 1.05, 1.25, 1.15, 1.45], 0, 0);
  await createLineItemWithVariants(wi05_02.id, 'Metal Stud Installation', 'SF', 'CREW-FRAM', 0.04, [0, 0, 0, 0, 0], 2.85, 0.25);

  // ============================================
  // DIVISION 06 - WOOD, PLASTICS & COMPOSITES
  // ============================================
  const div06 = divisions.find(d => d.divisionCode === '06')!;
  const cat06_01 = await createCategory(div06.id, 'Rough Carpentry', 1);
  const cat06_02 = await createCategory(div06.id, 'Finish Carpentry', 2);
  const cat06_03 = await createCategory(div06.id, 'Millwork', 3);

  const wi06_01 = await createWorkItem(cat06_01.id, 'Framing Lumber', 'material', 'Dimensional lumber');
  await createLineItemWithVariants(wi06_01.id, 'Lumber - 2x4 SPF (8ft)', 'EA', null, 0, [6.50, 8.50, 10.50, 9.50, 12.50], 0, 0);
  await createLineItemWithVariants(wi06_01.id, 'Lumber - 2x6 SPF (8ft)', 'EA', null, 0, [9.50, 12.50, 15.50, 14.00, 18.00], 0, 0);
  await createLineItemWithVariants(wi06_01.id, 'Lumber - 2x10 SPF (12ft)', 'EA', null, 0, [22.00, 28.00, 35.00, 31.00, 40.00], 0, 0);
  await createLineItemWithVariants(wi06_01.id, 'Plywood - 1/2" CDX (4x8)', 'EA', null, 0, [38.00, 48.00, 58.00, 52.00, 65.00], 0, 0);
  await createLineItemWithVariants(wi06_01.id, 'Plywood - 3/4" CDX (4x8)', 'EA', null, 0, [52.00, 65.00, 78.00, 72.00, 88.00], 0, 0);
  await createLineItemWithVariants(wi06_01.id, 'OSB Sheathing - 7/16" (4x8)', 'EA', null, 0, [28.00, 35.00, 42.00, 38.00, 48.00], 0, 0);

  const wi06_02 = await createWorkItem(cat06_01.id, 'Framing Labor', 'task', 'Carpentry labor');
  await createLineItemWithVariants(wi06_02.id, 'Framing - Exterior Walls', 'SF', 'CREW-FRAM', 0.04, [0, 0, 0, 0, 0], 3.50, 0.25);
  await createLineItemWithVariants(wi06_02.id, 'Framing - Interior Walls', 'LF', 'CREW-FRAM', 0.08, [0, 0, 0, 0, 0], 6.50, 0.15);
  await createLineItemWithVariants(wi06_02.id, 'Framing - Floor Joists', 'SF', 'CREW-FRAM', 0.03, [0, 0, 0, 0, 0], 2.75, 0.20);
  await createLineItemWithVariants(wi06_02.id, 'Framing - Roof Rafters', 'SF', 'CREW-FRAM', 0.05, [0, 0, 0, 0, 0], 4.85, 0.35);
  await createLineItemWithVariants(wi06_02.id, 'Sheathing Installation', 'SF', 'CREW-FRAM', 0.012, [0, 0, 0, 0, 0], 1.25, 0);

  const wi06_03 = await createWorkItem(cat06_02.id, 'Interior Trim', 'assembly', 'Finish carpentry');
  await createLineItemWithVariants(wi06_03.id, 'Baseboard - MDF 5-1/4"', 'LF', null, 0, [0.85, 1.15, 1.45, 1.25, 1.75], 0, 0);
  await createLineItemWithVariants(wi06_03.id, 'Baseboard - Wood 5-1/4"', 'LF', null, 0, [2.15, 3.25, 4.35, 3.75, 5.25], 0, 0);
  await createLineItemWithVariants(wi06_03.id, 'Door Casing - MDF', 'LF', null, 0, [0.95, 1.35, 1.75, 1.50, 2.00], 0, 0);
  await createLineItemWithVariants(wi06_03.id, 'Crown Molding - MDF', 'LF', null, 0, [1.45, 2.15, 2.85, 2.45, 3.35], 0, 0);
  await createLineItemWithVariants(wi06_03.id, 'Crown Molding - Wood', 'LF', null, 0, [3.50, 5.50, 7.50, 6.50, 8.50], 0, 0);
  await createLineItemWithVariants(wi06_03.id, 'Trim Installation - Baseboard', 'LF', 'CARP-01', 0.04, [0, 0, 0, 0, 0], 2.25, 0);
  await createLineItemWithVariants(wi06_03.id, 'Trim Installation - Crown', 'LF', 'CARP-01', 0.08, [0, 0, 0, 0, 0], 4.50, 0);

  const wi06_04 = await createWorkItem(cat06_03.id, 'Cabinets', 'assembly', 'Kitchen and vanity cabinets');
  await createLineItemWithVariants(wi06_04.id, 'Base Cabinet - 30" Standard', 'EA', null, 0, [145, 195, 275, 235, 345], 0, 0);
  await createLineItemWithVariants(wi06_04.id, 'Base Cabinet - 36" Standard', 'EA', null, 0, [175, 235, 325, 275, 395], 0, 0);
  await createLineItemWithVariants(wi06_04.id, 'Wall Cabinet - 30x30"', 'EA', null, 0, [125, 175, 245, 205, 295], 0, 0);
  await createLineItemWithVariants(wi06_04.id, 'Vanity Cabinet - 24"', 'EA', null, 0, [155, 215, 295, 245, 365], 0, 0);
  await createLineItemWithVariants(wi06_04.id, 'Vanity Cabinet - 36"', 'EA', null, 0, [215, 295, 395, 335, 475], 0, 0);
  await createLineItemWithVariants(wi06_04.id, 'Cabinet Installation - Kitchen', 'LF', 'CARP-01', 0.35, [0, 0, 0, 0, 0], 18.50, 0);

  // ============================================
  // DIVISION 07 - THERMAL & MOISTURE PROTECTION
  // ============================================
  const div07 = divisions.find(d => d.divisionCode === '07')!;
  const cat07_01 = await createCategory(div07.id, 'Insulation', 1);
  const cat07_02 = await createCategory(div07.id, 'Roofing', 2);
  const cat07_03 = await createCategory(div07.id, 'Waterproofing', 3);
  const cat07_04 = await createCategory(div07.id, 'Siding', 4);

  const wi07_01 = await createWorkItem(cat07_01.id, 'Building Insulation', 'material', 'Thermal insulation');
  await createLineItemWithVariants(wi07_01.id, 'Fiberglass Batt - R-13 (15"x32ft)', 'EA', null, 0, [32, 42, 52, 45, 62], 0, 0);
  await createLineItemWithVariants(wi07_01.id, 'Fiberglass Batt - R-19 (15"x32ft)', 'EA', null, 0, [42, 55, 68, 58, 78], 0, 0);
  await createLineItemWithVariants(wi07_01.id, 'Fiberglass Batt - R-30 (24"x48ft)', 'EA', null, 0, [75, 98, 120, 105, 145], 0, 0);
  await createLineItemWithVariants(wi07_01.id, 'Rigid Foam - 1" (4x8)', 'EA', null, 0, [25, 35, 45, 38, 55], 0, 0);
  await createLineItemWithVariants(wi07_01.id, 'Spray Foam - Open Cell', 'SF', null, 0, [1.25, 1.65, 2.05, 1.85, 2.45], 0, 0);
  await createLineItemWithVariants(wi07_01.id, 'Insulation Installation - Batts', 'SF', 'LAB-01', 0.01, [0, 0, 0, 0, 0], 0.65, 0);

  const wi07_02 = await createWorkItem(cat07_02.id, 'Asphalt Shingles', 'assembly', 'Composition roofing');
  await createLineItemWithVariants(wi07_02.id, 'Shingles - 3-Tab (25 year)', 'SQ', null, 0, [75, 95, 115, 105, 135], 0, 0);
  await createLineItemWithVariants(wi07_02.id, 'Shingles - Architectural (30 year)', 'SQ', null, 0, [105, 135, 165, 150, 195], 0, 0);
  await createLineItemWithVariants(wi07_02.id, 'Shingles - Architectural (50 year)', 'SQ', null, 0, [145, 185, 225, 205, 265], 0, 0);
  await createLineItemWithVariants(wi07_02.id, 'Roofing Felt - #15', 'SQ', null, 0, [15, 20, 25, 22, 30], 0, 0);
  await createLineItemWithVariants(wi07_02.id, 'Roofing Felt - #30', 'SQ', null, 0, [22, 28, 35, 30, 42], 0, 0);
  await createLineItemWithVariants(wi07_02.id, 'Synthetic Underlayment', 'SQ', null, 0, [38, 50, 62, 55, 72], 0, 0);
  await createLineItemWithVariants(wi07_02.id, 'Roofing Installation - Shingle', 'SQ', 'CREW-ROOF', 1.5, [0, 0, 0, 0, 0], 75, 5);
  await createLineItemWithVariants(wi07_02.id, 'Roof Tear-Off - Single Layer', 'SQ', 'CREW-ROOF', 0.75, [0, 0, 0, 0, 0], 45, 2);

  const wi07_03 = await createWorkItem(cat07_02.id, 'Metal Roofing', 'assembly', 'Standing seam and panels');
  await createLineItemWithVariants(wi07_03.id, 'Metal Panels - Ribbed (26 GA)', 'SF', null, 0, [3.50, 4.50, 5.50, 5.00, 6.50], 0, 0);
  await createLineItemWithVariants(wi07_03.id, 'Standing Seam (24 GA)', 'SF', null, 0, [6.50, 8.50, 10.50, 9.50, 12.50], 0, 0);
  await createLineItemWithVariants(wi07_03.id, 'Metal Roofing Installation', 'SF', 'CREW-ROOF', 0.08, [0, 0, 0, 0, 0], 5.50, 1.50);

  const wi07_04 = await createWorkItem(cat07_03.id, 'Waterproofing', 'assembly', 'Waterproof membranes');
  await createLineItemWithVariants(wi07_04.id, 'Peel & Stick Waterproofing', 'SF', null, 0, [1.50, 2.00, 2.50, 2.25, 3.00], 0, 0);
  await createLineItemWithVariants(wi07_04.id, 'Liquid Applied Waterproofing', 'SF', null, 0, [2.25, 3.00, 3.75, 3.25, 4.25], 0, 0);
  await createLineItemWithVariants(wi07_04.id, 'Waterproofing Application', 'SF', 'LAB-01', 0.02, [0, 0, 0, 0, 0], 0.85, 0);

  const wi07_05 = await createWorkItem(cat07_04.id, 'Vinyl Siding', 'assembly', 'Vinyl siding system');
  await createLineItemWithVariants(wi07_05.id, 'Vinyl Siding - Double 4"', 'SQ', null, 0, [65, 85, 105, 95, 125], 0, 0);
  await createLineItemWithVariants(wi07_05.id, 'Vinyl Siding - Dutch Lap', 'SQ', null, 0, [85, 110, 135, 120, 155], 0, 0);
  await createLineItemWithVariants(wi07_05.id, 'Vinyl Soffit - Solid', 'LF', null, 0, [2.25, 3.00, 3.75, 3.25, 4.25], 0, 0);
  await createLineItemWithVariants(wi07_05.id, 'Vinyl Fascia Cover', 'LF', null, 0, [2.75, 3.50, 4.25, 3.85, 5.00], 0, 0);
  await createLineItemWithVariants(wi07_05.id, 'Vinyl Siding Installation', 'SF', 'CREW-PAIN', 0.03, [0, 0, 0, 0, 0], 2.85, 0.25);

  const wi07_06 = await createWorkItem(cat07_04.id, 'Fiber Cement Siding', 'assembly', 'Hardie board siding');
  await createLineItemWithVariants(wi07_06.id, 'Fiber Cement Lap - 7.25"', 'SF', null, 0, [1.85, 2.35, 2.85, 2.60, 3.35], 0, 0);
  await createLineItemWithVariants(wi07_06.id, 'Fiber Cement Panel - 4x8', 'EA', null, 0, [38, 48, 58, 52, 68], 0, 0);
  await createLineItemWithVariants(wi07_06.id, 'Fiber Cement Trim - 1x4', 'LF', null, 0, [2.50, 3.25, 4.00, 3.50, 4.50], 0, 0);
  await createLineItemWithVariants(wi07_06.id, 'Fiber Cement Installation', 'SF', 'CREW-FRAM', 0.06, [0, 0, 0, 0, 0], 4.50, 0.50);

  // ============================================
  // DIVISION 08 - OPENINGS
  // ============================================
  const div08 = divisions.find(d => d.divisionCode === '08')!;
  const cat08_01 = await createCategory(div08.id, 'Doors', 1);
  const cat08_02 = await createCategory(div08.id, 'Windows', 2);
  const cat08_03 = await createCategory(div08.id, 'Glazing', 3);

  const wi08_01 = await createWorkItem(cat08_01.id, 'Interior Doors', 'assembly', 'Interior door assemblies');
  await createLineItemWithVariants(wi08_01.id, 'Interior Door - Hollow Core (6-panel)', 'EA', null, 0, [65, 85, 105, 95, 125], 0, 0);
  await createLineItemWithVariants(wi08_01.id, 'Interior Door - Solid Core (6-panel)', 'EA', null, 0, [145, 195, 245, 215, 295], 0, 0);
  await createLineItemWithVariants(wi08_01.id, 'Door Slab Only - Hollow Core', 'EA', null, 0, [35, 45, 55, 50, 65], 0, 0);
  await createLineItemWithVariants(wi08_01.id, 'Door Jamb Kit - Paint Grade', 'EA', null, 0, [45, 60, 75, 65, 85], 0, 0);
  await createLineItemWithVariants(wi08_01.id, 'Interior Door Installation', 'EA', 'CARP-01', 1.5, [0, 0, 0, 0, 0], 75, 0);

  const wi08_02 = await createWorkItem(cat08_01.id, 'Exterior Doors', 'assembly', 'Entry door assemblies');
  await createLineItemWithVariants(wi08_02.id, 'Entry Door - Steel 6-Panel', 'EA', null, 0, [285, 385, 485, 425, 585], 0, 0);
  await createLineItemWithVariants(wi08_02.id, 'Entry Door - Fiberglass 6-Panel', 'EA', null, 0, [485, 685, 885, 775, 1085], 0, 0);
  await createLineItemWithVariants(wi08_02.id, 'Entry Door - Wood (Mahogany)', 'EA', null, 0, [985, 1485, 1985, 1685, 2485], 0, 0);
  await createLineItemWithVariants(wi08_02.id, 'Entry Door Installation', 'EA', 'CARP-01', 2.5, [0, 0, 0, 0, 0], 165, 0);

  const wi08_03 = await createWorkItem(cat08_02.id, 'Vinyl Windows', 'assembly', 'Vinyl window assemblies');
  await createLineItemWithVariants(wi08_03.id, 'Vinyl Window - Double Hung 3x5', 'EA', null, 0, [195, 285, 375, 325, 445], 0, 0);
  await createLineItemWithVariants(wi08_03.id, 'Vinyl Window - Double Hung 4x6', 'EA', null, 0, [285, 385, 485, 425, 585], 0, 0);
  await createLineItemWithVariants(wi08_03.id, 'Vinyl Window - Casement 3x4', 'EA', null, 0, [325, 445, 565, 485, 685], 0, 0);
  await createLineItemWithVariants(wi08_03.id, 'Picture Window 4x6', 'EA', null, 0, [375, 525, 675, 585, 825], 0, 0);
  await createLineItemWithVariants(wi08_03.id, 'Sliding Glass Door 6ft', 'EA', null, 0, [585, 785, 985, 885, 1185], 0, 0);
  await createLineItemWithVariants(wi08_03.id, 'Window Installation', 'EA', 'CARP-01', 2, [0, 0, 0, 0, 0], 115, 0);

  // ============================================
  // DIVISION 09 - FINISHES
  // ============================================
  const div09 = divisions.find(d => d.divisionCode === '09')!;
  const cat09_01 = await createCategory(div09.id, 'Drywall', 1);
  const cat09_02 = await createCategory(div09.id, 'Flooring', 2);
  const cat09_03 = await createCategory(div09.id, 'Painting', 3);
  const cat09_04 = await createCategory(div09.id, 'Ceilings', 4);

  const wi09_01 = await createWorkItem(cat09_01.id, 'Drywall Board', 'material', 'Gypsum board');
  await createLineItemWithVariants(wi09_01.id, 'Drywall - 1/2" Regular (4x8)', 'EA', null, 0, [12, 15, 18, 16, 21], 0, 0);
  await createLineItemWithVariants(wi09_01.id, 'Drywall - 1/2" Regular (4x12)', 'EA', null, 0, [16, 20, 24, 22, 28], 0, 0);
  await createLineItemWithVariants(wi09_01.id, 'Drywall - 5/8" Type X (4x8)', 'EA', null, 0, [16, 20, 24, 22, 28], 0, 0);
  await createLineItemWithVariants(wi09_01.id, 'Drywall - Moisture Resistant (4x8)', 'EA', null, 0, [14, 18, 22, 19, 25], 0, 0);
  await createLineItemWithVariants(wi09_01.id, 'Drywall - 1/2" UL Fire Rated', 'EA', null, 0, [18, 24, 30, 26, 35], 0, 0);

  const wi09_02 = await createWorkItem(cat09_01.id, 'Drywall Installation', 'task', 'Hanging and finishing');
  await createLineItemWithVariants(wi09_02.id, 'Drywall Hanging - Walls', 'SF', 'CREW-DRYW', 0.02, [0, 0, 0, 0, 0], 1.65, 0);
  await createLineItemWithVariants(wi09_02.id, 'Drywall Hanging - Ceilings', 'SF', 'CREW-DRYW', 0.025, [0, 0, 0, 0, 0], 2.15, 0);
  await createLineItemWithVariants(wi09_02.id, 'Drywall Taping & Mudding', 'SF', 'CREW-DRYW', 0.03, [0, 0, 0, 0, 0], 2.35, 0);
  await createLineItemWithVariants(wi09_02.id, 'Drywall Finishing - Level 4', 'SF', 'CREW-DRYW', 0.015, [0, 0, 0, 0, 0], 1.45, 0);
  await createLineItemWithVariants(wi09_02.id, 'Drywall Finishing - Level 5', 'SF', 'CREW-DRYW', 0.025, [0, 0, 0, 0, 0], 2.45, 0);

  const wi09_03 = await createWorkItem(cat09_02.id, 'Hardwood Flooring', 'assembly', 'Wood flooring');
  await createLineItemWithVariants(wi09_03.id, 'Hardwood - Oak 3/4" Unfinished', 'SF', null, 0, [5.50, 7.50, 9.50, 8.50, 11.50], 0, 0);
  await createLineItemWithVariants(wi09_03.id, 'Hardwood - Oak 3/4" Prefinished', 'SF', null, 0, [7.50, 10.50, 13.50, 11.50, 15.50], 0, 0);
  await createLineItemWithVariants(wi09_03.id, 'Engineered Hardwood', 'SF', null, 0, [4.50, 6.50, 8.50, 7.50, 10.50], 0, 0);
  await createLineItemWithVariants(wi09_03.id, 'Hardwood Installation - Nail Down', 'SF', 'CREW-FLOR', 0.06, [0, 0, 0, 0, 0], 4.25, 0);
  await createLineItemWithVariants(wi09_03.id, 'Hardwood Refinishing', 'SF', 'CREW-FLOR', 0.08, [0, 0, 0, 0, 0], 3.85, 0);

  const wi09_04 = await createWorkItem(cat09_02.id, 'Laminate & Vinyl', 'assembly', 'Laminate and LVP flooring');
  await createLineItemWithVariants(wi09_04.id, 'Laminate Flooring - 8mm', 'SF', null, 0, [1.85, 2.65, 3.45, 2.95, 4.15], 0, 0);
  await createLineItemWithVariants(wi09_04.id, 'Laminate Flooring - 12mm', 'SF', null, 0, [2.65, 3.65, 4.65, 4.15, 5.65], 0, 0);
  await createLineItemWithVariants(wi09_04.id, 'LVP - Luxury Vinyl Plank', 'SF', null, 0, [2.35, 3.35, 4.35, 3.85, 5.35], 0, 0);
  await createLineItemWithVariants(wi09_04.id, 'LVT - Luxury Vinyl Tile', 'SF', null, 0, [2.85, 3.95, 5.05, 4.45, 6.15], 0, 0);
  await createLineItemWithVariants(wi09_04.id, 'Laminate/Vinyl Installation', 'SF', 'CREW-FLOR', 0.03, [0, 0, 0, 0, 0], 2.35, 0);

  const wi09_05 = await createWorkItem(cat09_02.id, 'Tile Flooring', 'assembly', 'Ceramic and porcelain tile');
  await createLineItemWithVariants(wi09_05.id, 'Ceramic Tile - 12x12 Basic', 'SF', null, 0, [1.65, 2.45, 3.25, 2.85, 4.05], 0, 0);
  await createLineItemWithVariants(wi09_05.id, 'Porcelain Tile - 12x24 Mid', 'SF', null, 0, [3.25, 4.85, 6.45, 5.65, 8.05], 0, 0);
  await createLineItemWithVariants(wi09_05.id, 'Natural Stone - Travertine', 'SF', null, 0, [6.50, 9.50, 12.50, 10.50, 15.50], 0, 0);
  await createLineItemWithVariants(wi09_05.id, 'Tile Backer Board - 1/4"', 'SF', null, 0, [0.95, 1.35, 1.75, 1.55, 2.15], 0, 0);
  await createLineItemWithVariants(wi09_05.id, 'Tile Installation - Floor', 'SF', 'CREW-FLOR', 0.08, [0, 0, 0, 0, 0], 5.75, 0);
  await createLineItemWithVariants(wi09_05.id, 'Tile Installation - Wall', 'SF', 'CREW-FLOR', 0.10, [0, 0, 0, 0, 0], 7.25, 0);

  const wi09_06 = await createWorkItem(cat09_02.id, 'Carpet', 'assembly', 'Carpet and padding');
  await createLineItemWithVariants(wi09_06.id, 'Carpet - Builder Grade', 'SF', null, 0, [1.85, 2.65, 3.45, 2.95, 4.15], 0, 0);
  await createLineItemWithVariants(wi09_06.id, 'Carpet - Mid Grade', 'SF', null, 0, [2.85, 4.15, 5.45, 4.85, 6.75], 0, 0);
  await createLineItemWithVariants(wi09_06.id, 'Carpet - Premium', 'SF', null, 0, [4.50, 6.50, 8.50, 7.50, 10.50], 0, 0);
  await createLineItemWithVariants(wi09_06.id, 'Carpet Pad - 6lb Rebond', 'SF', null, 0, [0.45, 0.65, 0.85, 0.75, 1.05], 0, 0);
  await createLineItemWithVariants(wi09_06.id, 'Carpet Installation', 'SF', 'CREW-FLOR', 0.015, [0, 0, 0, 0, 0], 1.65, 0);

  const wi09_07 = await createWorkItem(cat09_03.id, 'Interior Painting', 'task', 'Painting interior surfaces');
  await createLineItemWithVariants(wi09_07.id, 'Paint - Interior Flat (Gallon)', 'GAL', null, 0, [22, 35, 48, 40, 58], 0, 0);
  await createLineItemWithVariants(wi09_07.id, 'Paint - Interior Eggshell (Gallon)', 'GAL', null, 0, [28, 42, 56, 48, 68], 0, 0);
  await createLineItemWithVariants(wi09_07.id, 'Paint - Interior Semi-Gloss (Gallon)', 'GAL', null, 0, [30, 45, 60, 50, 72], 0, 0);
  await createLineItemWithVariants(wi09_07.id, 'Primer - Interior (Gallon)', 'GAL', null, 0, [18, 28, 38, 32, 45], 0, 0);
  await createLineItemWithVariants(wi09_07.id, 'Painting - Walls (2 coats)', 'SF', 'CREW-PAIN', 0.02, [0, 0, 0, 0, 0], 1.15, 0);
  await createLineItemWithVariants(wi09_07.id, 'Painting - Ceilings (2 coats)', 'SF', 'CREW-PAIN', 0.025, [0, 0, 0, 0, 0], 1.45, 0);
  await createLineItemWithVariants(wi09_07.id, 'Painting - Trim', 'LF', 'CREW-PAIN', 0.015, [0, 0, 0, 0, 0], 1.35, 0);
  await createLineItemWithVariants(wi09_07.id, 'Painting - Doors (both sides)', 'EA', 'PAIN-01', 1, [0, 0, 0, 0, 0], 65, 0);

  // ============================================
  // DIVISION 22 - PLUMBING
  // ============================================
  const div22 = divisions.find(d => d.divisionCode === '22')!;
  const cat22_01 = await createCategory(div22.id, 'Plumbing Fixtures', 1);
  const cat22_02 = await createCategory(div22.id, 'Water Supply', 2);
  const cat22_03 = await createCategory(div22.id, 'Drainage', 3);

  const wi22_01 = await createWorkItem(cat22_01.id, 'Fixtures', 'assembly', 'Plumbing fixtures');
  await createLineItemWithVariants(wi22_01.id, 'Toilet - Standard Round', 'EA', null, 0, [145, 215, 285, 245, 345], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Toilet - Comfort Height Elongated', 'EA', null, 0, [225, 325, 425, 365, 525], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Kitchen Sink - Stainless Drop-in', 'EA', null, 0, [125, 195, 265, 225, 325], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Kitchen Sink - Undermount', 'EA', null, 0, [185, 285, 385, 325, 465], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Bathroom Sink - Vessel', 'EA', null, 0, [85, 145, 205, 175, 265], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Bathroom Sink - Undermount', 'EA', null, 0, [125, 195, 265, 225, 325], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Bathtub - Alcove Fiberglass', 'EA', null, 0, [285, 425, 565, 485, 685], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Shower Base - Fiberglass', 'EA', null, 0, [225, 345, 465, 395, 565], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Kitchen Faucet - Standard', 'EA', null, 0, [95, 165, 235, 195, 295], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Kitchen Faucet - Pull Down', 'EA', null, 0, [165, 285, 405, 345, 485], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Bathroom Faucet - Centerset', 'EA', null, 0, [55, 95, 135, 115, 165], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Shower Valve - Pressure Balance', 'EA', null, 0, [125, 195, 265, 225, 325], 0, 0);
  await createLineItemWithVariants(wi22_01.id, 'Toilet Installation', 'EA', 'PLMB-01', 1.5, [0, 0, 0, 0, 0], 95, 0);
  await createLineItemWithVariants(wi22_01.id, 'Sink Installation - Kitchen', 'EA', 'PLMB-01', 2, [0, 0, 0, 0, 0], 145, 0);
  await createLineItemWithVariants(wi22_01.id, 'Faucet Installation', 'EA', 'PLMB-01', 1, [0, 0, 0, 0, 0], 85, 0);

  const wi22_02 = await createWorkItem(cat22_02.id, 'Water Piping', 'assembly', 'Supply piping');
  await createLineItemWithVariants(wi22_02.id, 'PEX Tubing - 1/2" (100ft roll)', 'EA', null, 0, [32, 45, 58, 48, 68], 0, 0);
  await createLineItemWithVariants(wi22_02.id, 'PEX Tubing - 3/4" (100ft roll)', 'EA', null, 0, [45, 65, 85, 72, 98], 0, 0);
  await createLineItemWithVariants(wi22_02.id, 'Copper Pipe - 1/2" Type L (10ft)', 'EA', null, 0, [28, 38, 48, 42, 58], 0, 0);
  await createLineItemWithVariants(wi22_02.id, 'Copper Pipe - 3/4" Type L (10ft)', 'EA', null, 0, [42, 58, 74, 64, 88], 0, 0);
  await createLineItemWithVariants(wi22_02.id, 'Rough-In Plumbing - Bathroom', 'EA', 'PLMB-01', 8, [0, 0, 0, 0, 0], 450, 0);
  await createLineItemWithVariants(wi22_02.id, 'Rough-In Plumbing - Kitchen', 'EA', 'PLMB-01', 4, [0, 0, 0, 0, 0], 225, 0);

  const wi22_03 = await createWorkItem(cat22_03.id, 'Water Heater', 'assembly', 'Hot water systems');
  await createLineItemWithVariants(wi22_03.id, 'Water Heater - Electric 50gal', 'EA', null, 0, [485, 645, 805, 685, 965], 0, 0);
  await createLineItemWithVariants(wi22_03.id, 'Water Heater - Gas 50gal', 'EA', null, 0, [585, 785, 985, 835, 1185], 0, 0);
  await createLineItemWithVariants(wi22_03.id, 'Tankless Water Heater - Gas', 'EA', null, 0, [985, 1485, 1985, 1685, 2485], 0, 0);
  await createLineItemWithVariants(wi22_03.id, 'Water Heater Installation - Standard', 'EA', 'PLMB-01', 4, [0, 0, 0, 0, 0], 385, 25);

  // ============================================
  // DIVISION 23 - HVAC
  // ============================================
  const div23 = divisions.find(d => d.divisionCode === '23')!;
  const cat23_01 = await createCategory(div23.id, 'Heating', 1);
  const cat23_02 = await createCategory(div23.id, 'Air Conditioning', 2);
  const cat23_03 = await createCategory(div23.id, 'Air Distribution', 3);

  const wi23_01 = await createWorkItem(cat23_01.id, 'Furnaces', 'assembly', 'Heating systems');
  await createLineItemWithVariants(wi23_01.id, 'Gas Furnace - 80% Efficiency', 'EA', null, 0, [1685, 2285, 2885, 2485, 3485], 0, 0);
  await createLineItemWithVariants(wi23_01.id, 'Gas Furnace - 95% Efficiency', 'EA', null, 0, [2485, 3285, 4085, 3585, 4885], 0, 0);
  await createLineItemWithVariants(wi23_01.id, 'Furnace Installation', 'EA', 'HVAC-01', 8, [0, 0, 0, 0, 0], 685, 45);

  const wi23_02 = await createWorkItem(cat23_02.id, 'Air Conditioners', 'assembly', 'Cooling systems');
  await createLineItemWithVariants(wi23_02.id, 'AC Condenser - 14 SEER 3 Ton', 'EA', null, 0, [2185, 2985, 3785, 3285, 4585], 0, 0);
  await createLineItemWithVariants(wi23_02.id, 'AC Condenser - 16 SEER 3 Ton', 'EA', null, 0, [2885, 3885, 4885, 4285, 5885], 0, 0);
  await createLineItemWithVariants(wi23_02.id, 'AC Condenser - 18 SEER 3 Ton', 'EA', null, 0, [3585, 4785, 5985, 5285, 7185], 0, 0);
  await createLineItemWithVariants(wi23_02.id, 'AC Installation', 'EA', 'HVAC-01', 8, [0, 0, 0, 0, 0], 985, 65);

  const wi23_03 = await createWorkItem(cat23_03.id, 'Ductwork', 'assembly', 'Air distribution');
  await createLineItemWithVariants(wi23_03.id, 'Sheet Metal Duct - Rectangular', 'LF', null, 0, [12, 18, 24, 20, 28], 0, 0);
  await createLineItemWithVariants(wi23_03.id, 'Flex Duct - 6" Insulated', 'LF', null, 0, [3.25, 4.85, 6.45, 5.65, 7.85], 0, 0);
  await createLineItemWithVariants(wi23_03.id, 'Floor Register - 4x10', 'EA', null, 0, [6.50, 9.50, 12.50, 10.50, 15.50], 0, 0);
  await createLineItemWithVariants(wi23_03.id, 'Return Air Grille - 20x20', 'EA', null, 0, [16, 24, 32, 28, 40], 0, 0);
  await createLineItemWithVariants(wi23_03.id, 'Ductwork Installation', 'LF', 'HVAC-01', 0.25, [0, 0, 0, 0, 0], 18.50, 0);
  await createLineItemWithVariants(wi23_03.id, 'Thermostat - Programmable', 'EA', null, 0, [38, 65, 92, 78, 115], 0, 0);
  await createLineItemWithVariants(wi23_03.id, 'Thermostat - Smart WiFi', 'EA', null, 0, [185, 285, 385, 335, 485], 0, 0);

  // ============================================
  // DIVISION 26 - ELECTRICAL
  // ============================================
  const div26 = divisions.find(d => d.divisionCode === '26')!;
  const cat26_01 = await createCategory(div26.id, 'Wiring', 1);
  const cat26_02 = await createCategory(div26.id, 'Devices', 2);
  const cat26_03 = await createCategory(div26.id, 'Lighting', 3);

  const wi26_01 = await createWorkItem(cat26_01.id, 'Electrical Wire', 'material', 'Wire and cable');
  await createLineItemWithVariants(wi26_01.id, 'Romex - 14/2 (250ft)', 'EA', null, 0, [68, 95, 122, 105, 148], 0, 0);
  await createLineItemWithVariants(wi26_01.id, 'Romex - 12/2 (250ft)', 'EA', null, 0, [88, 125, 162, 138, 195], 0, 0);
  await createLineItemWithVariants(wi26_01.id, 'Romex - 10/2 (100ft)', 'EA', null, 0, [58, 82, 106, 92, 128], 0, 0);
  await createLineItemWithVariants(wi26_01.id, 'Romex - 10/3 (100ft)', 'EA', null, 0, [78, 112, 146, 125, 175], 0, 0);

  const wi26_02 = await createWorkItem(cat26_01.id, 'Electrical Panels', 'assembly', 'Service panels');
  await createLineItemWithVariants(wi26_02.id, 'Panel - 200A Main Breaker', 'EA', null, 0, [165, 245, 325, 275, 385], 0, 0);
  await createLineItemWithVariants(wi26_02.id, 'Circuit Breaker - 20A', 'EA', null, 0, [5.50, 8.50, 11.50, 9.50, 14.50], 0, 0);
  await createLineItemWithVariants(wi26_02.id, 'Circuit Breaker - 15A AFCI', 'EA', null, 0, [28, 42, 56, 48, 68], 0, 0);
  await createLineItemWithVariants(wi26_02.id, 'Panel Installation - 200A', 'EA', 'ELEC-01', 8, [0, 0, 0, 0, 0], 485, 45);

  const wi26_03 = await createWorkItem(cat26_02.id, 'Outlets & Switches', 'assembly', 'Wiring devices');
  await createLineItemWithVariants(wi26_03.id, 'Outlet - Standard 15A', 'EA', null, 0, [1.25, 2.25, 3.25, 2.75, 4.25], 0, 0);
  await createLineItemWithVariants(wi26_03.id, 'Outlet - GFCI', 'EA', null, 0, [12, 18, 24, 20, 28], 0, 0);
  await createLineItemWithVariants(wi26_03.id, 'Switch - Single Pole', 'EA', null, 0, [1.85, 3.25, 4.65, 3.85, 5.45], 0, 0);
  await createLineItemWithVariants(wi26_03.id, 'Switch - 3-Way', 'EA', null, 0, [2.45, 4.25, 6.05, 5.15, 7.25], 0, 0);
  await createLineItemWithVariants(wi26_03.id, 'Switch - Dimmer', 'EA', null, 0, [16, 28, 40, 32, 48], 0, 0);
  await createLineItemWithVariants(wi26_03.id, 'Outlet Installation - New Work', 'EA', 'ELEC-01', 0.5, [0, 0, 0, 0, 0], 55, 0);
  await createLineItemWithVariants(wi26_03.id, 'Outlet Installation - Retrofit', 'EA', 'ELEC-01', 0.75, [0, 0, 0, 0, 0], 85, 0);
  await createLineItemWithVariants(wi26_03.id, 'Switch Installation', 'EA', 'ELEC-01', 0.5, [0, 0, 0, 0, 0], 48, 0);

  const wi26_04 = await createWorkItem(cat26_03.id, 'Lighting', 'assembly', 'Light fixtures');
  await createLineItemWithVariants(wi26_04.id, 'Recessed Can - IC Rated', 'EA', null, 0, [10, 15, 20, 17, 24], 0, 0);
  await createLineItemWithVariants(wi26_04.id, 'LED Trim - Recessed 6"', 'EA', null, 0, [12, 18, 24, 20, 28], 0, 0);
  await createLineItemWithVariants(wi26_04.id, 'Ceiling Light - Flush Mount', 'EA', null, 0, [25, 45, 65, 55, 85], 0, 0);
  await createLineItemWithVariants(wi26_04.id, 'Ceiling Fan - Basic', 'EA', null, 0, [85, 145, 205, 175, 265], 0, 0);
  await createLineItemWithVariants(wi26_04.id, 'Ceiling Fan - Premium', 'EA', null, 0, [185, 325, 465, 385, 585], 0, 0);
  await createLineItemWithVariants(wi26_04.id, 'Recessed Light Installation', 'EA', 'ELEC-01', 0.75, [0, 0, 0, 0, 0], 85, 0);
  await createLineItemWithVariants(wi26_04.id, 'Ceiling Fan Installation', 'EA', 'ELEC-01', 1.5, [0, 0, 0, 0, 0], 115, 0);
  await createLineItemWithVariants(wi26_04.id, 'Light Fixture Installation', 'EA', 'ELEC-01', 0.5, [0, 0, 0, 0, 0], 65, 0);

  // ============================================
  // DIVISION 31 - EARTHWORK
  // ============================================
  const div31 = divisions.find(d => d.divisionCode === '31')!;
  const cat31_01 = await createCategory(div31.id, 'Excavation', 1);
  const cat31_02 = await createCategory(div31.id, 'Grading', 2);

  const wi31_01 = await createWorkItem(cat31_01.id, 'Excavation', 'task', 'Earth excavation');
  await createLineItemWithVariants(wi31_01.id, 'Excavation - Bulk (mechanical)', 'CY', 'CREW-EXCA', 0.05, [0, 0, 0, 0, 0], 4.50, 8.50);
  await createLineItemWithVariants(wi31_01.id, 'Excavation - Foundation', 'CY', 'CREW-EXCA', 0.08, [0, 0, 0, 0, 0], 7.50, 12.50);
  await createLineItemWithVariants(wi31_01.id, 'Excavation - Trenching', 'LF', 'CREW-EXCA', 0.02, [0, 0, 0, 0, 0], 3.85, 6.50);
  await createLineItemWithVariants(wi31_01.id, 'Backfill & Compaction', 'CY', 'CREW-EXCA', 0.03, [0, 0, 0, 0, 0], 3.25, 5.50);
  await createLineItemWithVariants(wi31_01.id, 'Haul Away - Excavated Material', 'CY', 'LAB-01', 0.02, [12, 18, 24, 20, 28], 1.50, 2.50);

  const wi31_02 = await createWorkItem(cat31_02.id, 'Grading', 'task', 'Site grading');
  await createLineItemWithVariants(wi31_02.id, 'Rough Grading', 'SF', 'EQUIP-01', 0.005, [0, 0, 0, 0, 0], 0.35, 0.85);
  await createLineItemWithVariants(wi31_02.id, 'Finish Grading', 'SF', 'EQUIP-01', 0.008, [0, 0, 0, 0, 0], 0.55, 1.25);

  // ============================================
  // AREA MODIFIERS
  // ============================================
  const areaModifiers = await Promise.all([
    prisma.areaModifier.create({
      data: {
        modifierCode: 'NAT-AVG',
        modifierName: 'National Average',
        description: 'Baseline national average costs',
        adjustmentType: 'percentage',
        adjustmentValue: 1.00,
        appliesTo: 'all',
        isActive: true,
      }
    }),
    prisma.areaModifier.create({
      data: {
        modifierCode: 'NE-REG',
        modifierName: 'Northeast Region',
        description: 'New England and Northeast states',
        adjustmentType: 'percentage',
        adjustmentValue: 1.15,
        appliesTo: 'all',
        isActive: true,
      }
    }),
    prisma.areaModifier.create({
      data: {
        modifierCode: 'SE-REG',
        modifierName: 'Southeast Region',
        description: 'Southeast and Gulf states',
        adjustmentType: 'percentage',
        adjustmentValue: 0.95,
        appliesTo: 'all',
        isActive: true,
      }
    }),
    prisma.areaModifier.create({
      data: {
        modifierCode: 'MW-REG',
        modifierName: 'Midwest Region',
        description: 'Midwest and Great Plains states',
        adjustmentType: 'percentage',
        adjustmentValue: 0.98,
        appliesTo: 'all',
        isActive: true,
      }
    }),
    prisma.areaModifier.create({
      data: {
        modifierCode: 'SW-REG',
        modifierName: 'Southwest Region',
        description: 'Texas, Arizona, New Mexico',
        adjustmentType: 'percentage',
        adjustmentValue: 0.92,
        appliesTo: 'all',
        isActive: true,
      }
    }),
    prisma.areaModifier.create({
      data: {
        modifierCode: 'W-REG',
        modifierName: 'West Region',
        description: 'Pacific Coast and Mountain states',
        adjustmentType: 'percentage',
        adjustmentValue: 1.20,
        appliesTo: 'all',
        isActive: true,
      }
    }),
    prisma.areaModifier.create({
      data: {
        modifierCode: 'URBAN',
        modifierName: 'Urban Metro',
        description: 'Major metropolitan area adjustment',
        adjustmentType: 'percentage',
        adjustmentValue: 1.10,
        appliesTo: 'labor',
        isActive: true,
      }
    }),
    prisma.areaModifier.create({
      data: {
        modifierCode: 'RURAL',
        modifierName: 'Rural Area',
        description: 'Rural area adjustment',
        adjustmentType: 'percentage',
        adjustmentValue: 0.90,
        appliesTo: 'labor',
        isActive: true,
      }
    }),
  ]);
  console.log(`Created ${areaModifiers.length} area modifiers`);

  // ============================================
  // SAMPLE PROJECT
  // ============================================
  const project = await prisma.project.create({
    data: {
      name: 'Kitchen Renovation - Johnson Residence',
      description: 'Complete kitchen renovation including new cabinets, countertops, flooring, appliances, and electrical updates',
      clientName: 'John Johnson',
      clientEmail: 'john.johnson@email.com',
      clientPhone: '(555) 123-4567',
      address: '123 Main Street, Springfield, IL 62701',
      projectType: 'renovation',
      status: 'in_progress',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      totalBudget: 45000,
    },
  });

  // Create sample rooms
  const kitchen = await prisma.room.create({
    data: {
      projectId: project.id,
      name: 'Kitchen',
      roomType: 'kitchen',
      length: 15,
      width: 12,
      height: 8,
      floorArea: 180,
      wallArea: 432,
      positionX: 50,
      positionY: 50,
    },
  });

  const diningRoom = await prisma.room.create({
    data: {
      projectId: project.id,
      name: 'Dining Room',
      roomType: 'dining_room',
      length: 12,
      width: 10,
      height: 8,
      floorArea: 120,
      wallArea: 352,
      positionX: 220,
      positionY: 50,
    },
  });

  console.log(`Created sample project with 2 rooms`);

  // Summary
  console.log('\n========================================');
  console.log('Database seeding completed!');
  console.log(`Divisions: ${divisions.length}`);
  console.log(`Categories: ${categoryCount.count}`);
  console.log(`Work Items: ${workItemCount.count}`);
  console.log(`Line Items: ${lineItemCount.count}`);
  console.log(`Labor Codes: ${laborCodes.length}`);
  console.log(`Units: ${units.length}`);
  console.log(`Material Variants: ${variants.length}`);
  console.log(`Area Modifiers: ${areaModifiers.length}`);
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
