import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CSI MasterFormat 2024 Divisions
const DIVISIONS = [
  { divisionCode: "01", divisionName: "General Requirements", divisionTitle: "Project Management & Coordination" },
  { divisionCode: "02", divisionName: "Existing Conditions", divisionTitle: "Assessment & Remediation" },
  { divisionCode: "03", divisionName: "Concrete", divisionTitle: "Cast-in-Place Concrete" },
  { divisionCode: "04", divisionName: "Masonry", divisionTitle: "Unit Masonry" },
  { divisionCode: "05", divisionName: "Metals", divisionTitle: "Structural & Miscellaneous Metals" },
  { divisionCode: "06", divisionName: "Wood, Plastics & Composites", divisionTitle: "Rough Carpentry" },
  { divisionCode: "07", divisionName: "Thermal & Moisture Protection", divisionTitle: "Insulation & Waterproofing" },
  { divisionCode: "08", divisionName: "Openings", divisionTitle: "Doors, Windows & Glazing" },
  { divisionCode: "09", divisionName: "Finishes", divisionTitle: "Interior Finishes" },
  { divisionCode: "10", divisionName: "Specialties", divisionTitle: "Specialty Items" },
  { divisionCode: "11", divisionName: "Equipment", divisionTitle: "Built-In Equipment" },
  { divisionCode: "12", divisionName: "Furnishings", divisionTitle: "Interior Furnishings" },
  { divisionCode: "13", divisionName: "Special Construction", divisionTitle: "Unique Construction" },
  { divisionCode: "14", divisionName: "Conveying Equipment", divisionTitle: "Elevators & Conveyors" },
  { divisionCode: "21", divisionName: "Fire Suppression", divisionTitle: "Fire Protection Systems" },
  { divisionCode: "22", divisionName: "Plumbing", divisionTitle: "Plumbing Systems" },
  { divisionCode: "23", divisionName: "HVAC", divisionTitle: "Heating, Ventilating & Air Conditioning" },
  { divisionCode: "26", divisionName: "Electrical", divisionTitle: "Electrical Systems" },
  { divisionCode: "27", divisionName: "Communications", divisionTitle: "Communications Systems" },
  { divisionCode: "28", divisionName: "Electronic Safety & Security", divisionTitle: "Security Systems" },
  { divisionCode: "31", divisionName: "Earthwork", divisionTitle: "Excavation & Grading" },
  { divisionCode: "32", divisionName: "Exterior Improvements", divisionTitle: "Paving & Landscaping" },
  { divisionCode: "33", divisionName: "Utilities", divisionTitle: "Underground Utilities" },
];

// Category structure for Division 09 - Finishes (fine-grained)
const FINISHES_CATEGORIES = [
  // 09 20 00 - Plaster and Gypsum Board
  { categoryName: "Plaster & Gypsum Board", subcategories: [
    { categoryName: "Gypsum Board", description: "Drywall panels and installation" },
    { categoryName: "Gypsum Board Finishing", description: "Taping, mudding, and finishing" },
    { categoryName: "Plaster", description: "Traditional plaster applications" },
    { categoryName: "Gypsum Ceilings", description: "Suspended and direct-applied gypsum ceilings" },
  ]},
  // 09 30 00 - Tiling
  { categoryName: "Tile", subcategories: [
    { categoryName: "Ceramic Tile", description: "Standard ceramic floor and wall tile" },
    { categoryName: "Porcelain Tile", description: "High-density porcelain tile" },
    { categoryName: "Natural Stone Tile", description: "Marble, granite, travertine, slate" },
    { categoryName: "Glass Tile", description: "Glass mosaic and field tile" },
    { categoryName: "Tile Setting Materials", description: "Thinset, grout, backer board" },
  ]},
  // 09 50 00 - Ceilings
  { categoryName: "Ceilings", subcategories: [
    { categoryName: "Acoustical Ceilings", description: "Suspended acoustic tile ceilings" },
    { categoryName: "Drywall Ceilings", description: "Gypsum board ceilings" },
    { categoryName: "Specialty Ceilings", description: "Metal, wood, and decorative ceilings" },
  ]},
  // 09 60 00 - Flooring
  { categoryName: "Flooring", subcategories: [
    { categoryName: "Hardwood Flooring", description: "Solid and engineered hardwood" },
    { categoryName: "Laminate Flooring", description: "Laminate plank and tile" },
    { categoryName: "Luxury Vinyl", description: "LVP, LVT, and WPC flooring" },
    { categoryName: "Resilient Flooring", description: "VCT, sheet vinyl, rubber" },
    { categoryName: "Carpet", description: "Broadloom carpet and carpet tile" },
    { categoryName: "Underlayment", description: "Floor prep and underlayment materials" },
  ]},
  // 09 90 00 - Painting and Coating
  { categoryName: "Paint & Coatings", subcategories: [
    { categoryName: "Interior Paint", description: "Interior wall and ceiling paint" },
    { categoryName: "Exterior Paint", description: "Exterior paint and stains" },
    { categoryName: "Primers & Sealers", description: "Surface preparation coatings" },
    { categoryName: "Specialty Coatings", description: "Epoxy, elastomeric, waterproofing" },
    { categoryName: "Stains & Finishes", description: "Wood stains and clear finishes" },
  ]},
];

// Category structure for Division 06 - Wood & Plastics
const WOOD_CATEGORIES = [
  { categoryName: "Rough Carpentry", subcategories: [
    { categoryName: "Dimensional Lumber", description: "Standard framing lumber" },
    { categoryName: "Treated Lumber", description: "Pressure-treated wood" },
    { categoryName: "Engineered Lumber", description: "LVL, I-joists, glulam" },
    { categoryName: "Sheathing", description: "Plywood and OSB panels" },
  ]},
  { categoryName: "Finish Carpentry", subcategories: [
    { categoryName: "Interior Trim", description: "Baseboard, casing, chair rail" },
    { categoryName: "Crown Molding", description: "Decorative crown and cornice" },
    { categoryName: "Wainscoting", description: "Paneling and beadboard" },
  ]},
  { categoryName: "Millwork", subcategories: [
    { categoryName: "Stair Parts", description: "Treads, risers, railings" },
    { categoryName: "Cabinetry", description: "Cabinet boxes and doors" },
    { categoryName: "Countertops", description: "Laminate and solid surface" },
  ]},
];

// Category structure for Division 08 - Openings
const OPENINGS_CATEGORIES = [
  { categoryName: "Doors", subcategories: [
    { categoryName: "Interior Doors", description: "Wood and composite interior doors" },
    { categoryName: "Exterior Doors", description: "Entry and patio doors" },
    { categoryName: "Commercial Doors", description: "Metal and fire-rated doors" },
    { categoryName: "Specialty Doors", description: "Pocket, barn, folding doors" },
  ]},
  { categoryName: "Windows", subcategories: [
    { categoryName: "Vinyl Windows", description: "Vinyl frame windows" },
    { categoryName: "Wood Windows", description: "Wood and clad-wood windows" },
    { categoryName: "Aluminum Windows", description: "Aluminum frame windows" },
    { categoryName: "Specialty Windows", description: "Bay, bow, skylights" },
  ]},
  { categoryName: "Hardware", subcategories: [
    { categoryName: "Door Hardware", description: "Locks, hinges, handles" },
    { categoryName: "Window Hardware", description: "Operators, locks, cranks" },
    { categoryName: "Accessories", description: "Closers, stops, thresholds" },
  ]},
];

// Labor codes with rates
const LABOR_CODES = [
  { laborCode: "B1", codeName: "Building Carpenter I", description: "Journeyman carpenter", baseHourlyRate: 45.00, isCrew: false },
  { laborCode: "BC", codeName: "Building Carpenter Crew", description: "2-person carpenter crew", baseHourlyRate: 78.00, isCrew: true },
  { laborCode: "SW", codeName: "Sheet Metal Worker", description: "Journeyman sheet metal worker", baseHourlyRate: 52.00, isCrew: false },
  { laborCode: "M8", codeName: "Master Pipefitter", description: "Journeyman pipefitter", baseHourlyRate: 58.00, isCrew: false },
  { laborCode: "E1", codeName: "Electrician I", description: "Journeyman electrician", baseHourlyRate: 52.00, isCrew: false },
  { laborCode: "P1", codeName: "Plumber I", description: "Journeyman plumber", baseHourlyRate: 55.00, isCrew: false },
  { laborCode: "G1", codeName: "General Laborer", description: "General construction laborer", baseHourlyRate: 28.00, isCrew: false },
  { laborCode: "D1", codeName: "Drywall Installer", description: "Drywall hanger/finisher", baseHourlyRate: 42.00, isCrew: false },
  { laborCode: "PT", codeName: "Painting Crew", description: "2-person painting crew", baseHourlyRate: 75.00, isCrew: true },
  { laborCode: "T1", codeName: "Tile Setter", description: "Journeyman tile setter", baseHourlyRate: 48.00, isCrew: false },
  { laborCode: "RF", codeName: "Roofing Crew", description: "4-person roofing crew", baseHourlyRate: 180.00, isCrew: true },
];

// Units of measurement
const UNITS = [
  { unitCode: "SF", unitName: "Square Foot", description: "Area in square feet" },
  { unitCode: "SY", unitName: "Square Yard", description: "Area in square yards", conversionFactorToBase: 9, baseUnit: "SF" },
  { unitCode: "LF", unitName: "Linear Foot", description: "Length in linear feet" },
  { unitCode: "Ea", unitName: "Each", description: "Individual unit" },
  { unitCode: "CY", unitName: "Cubic Yard", description: "Volume in cubic yards" },
  { unitCode: "CF", unitName: "Cubic Foot", description: "Volume in cubic feet" },
  { unitCode: "Gal", unitName: "Gallon", description: "Liquid volume in gallons" },
  { unitCode: "LB", unitName: "Pound", description: "Weight in pounds" },
  { unitCode: "Ton", unitName: "Ton", description: "Weight in tons", conversionFactorToBase: 2000, baseUnit: "LB" },
  { unitCode: "Sq", unitName: "Square (100 SF)", description: "Roofing square", conversionFactorToBase: 100, baseUnit: "SF" },
  { unitCode: "Hr", unitName: "Hour", description: "Labor hours" },
  { unitCode: "Day", unitName: "Day", description: "Work days", conversionFactorToBase: 8, baseUnit: "Hr" },
];

// Sample line items for Division 09 - Finishes
const FINISHES_LINE_ITEMS: Record<string, Array<{description: string, unit: string, laborCode: string, laborHours: number, materialCost: number, laborCost: number}>> = {
  // Gypsum Board
  "Gypsum Board": [
    { description: "1/2\" regular gypsum board, 4x8 panel", unit: "SF", laborCode: "D1", laborHours: 0.025, materialCost: 0.45, laborCost: 1.05 },
    { description: "1/2\" regular gypsum board, 4x12 panel", unit: "SF", laborCode: "D1", laborHours: 0.022, materialCost: 0.42, laborCost: 0.92 },
    { description: "5/8\" fire-resistant gypsum board, Type X", unit: "SF", laborCode: "D1", laborHours: 0.028, materialCost: 0.65, laborCost: 1.18 },
    { description: "1/2\" moisture-resistant gypsum board (green board)", unit: "SF", laborCode: "D1", laborHours: 0.025, materialCost: 0.55, laborCost: 1.05 },
    { description: "1/2\" soundproof gypsum board", unit: "SF", laborCode: "D1", laborHours: 0.025, materialCost: 1.25, laborCost: 1.05 },
  ],
  "Gypsum Board Finishing": [
    { description: "Taping and finishing - Level 4 (smooth)", unit: "SF", laborCode: "D1", laborHours: 0.06, materialCost: 0.15, laborCost: 2.52 },
    { description: "Taping and finishing - Level 5 (skim coat)", unit: "SF", laborCode: "D1", laborHours: 0.10, materialCost: 0.25, laborCost: 4.20 },
    { description: "Texture spray - orange peel", unit: "SF", laborCode: "D1", laborHours: 0.02, materialCost: 0.08, laborCost: 0.84 },
    { description: "Texture spray - knockdown", unit: "SF", laborCode: "D1", laborHours: 0.025, materialCost: 0.10, laborCost: 1.05 },
    { description: "Corner bead installation - metal", unit: "LF", laborCode: "D1", laborHours: 0.02, materialCost: 0.45, laborCost: 0.84 },
  ],
  // Tile
  "Ceramic Tile": [
    { description: "4x4 ceramic wall tile, standard grade", unit: "SF", laborCode: "T1", laborHours: 0.15, materialCost: 2.50, laborCost: 7.20 },
    { description: "12x12 ceramic floor tile, standard grade", unit: "SF", laborCode: "T1", laborHours: 0.12, materialCost: 3.00, laborCost: 5.76 },
    { description: "12x24 ceramic floor tile, rectified", unit: "SF", laborCode: "T1", laborHours: 0.14, materialCost: 4.50, laborCost: 6.72 },
    { description: "Mosaic tile sheet (mesh-backed)", unit: "SF", laborCode: "T1", laborHours: 0.20, materialCost: 8.00, laborCost: 9.60 },
  ],
  "Porcelain Tile": [
    { description: "12x24 porcelain floor tile", unit: "SF", laborCode: "T1", laborHours: 0.14, materialCost: 5.00, laborCost: 6.72 },
    { description: "24x24 porcelain floor tile", unit: "SF", laborCode: "T1", laborHours: 0.16, materialCost: 6.50, laborCost: 7.68 },
    { description: "Large format porcelain (32x32+)", unit: "SF", laborCode: "T1", laborHours: 0.20, materialCost: 8.00, laborCost: 9.60 },
    { description: "Porcelain wood-look plank (6x36)", unit: "SF", laborCode: "T1", laborHours: 0.15, materialCost: 4.50, laborCost: 7.20 },
  ],
  "Natural Stone Tile": [
    { description: "Travertine tile 12x12", unit: "SF", laborCode: "T1", laborHours: 0.18, materialCost: 8.00, laborCost: 8.64 },
    { description: "Marble tile 12x12", unit: "SF", laborCode: "T1", laborHours: 0.20, materialCost: 15.00, laborCost: 9.60 },
    { description: "Granite tile 12x12", unit: "SF", laborCode: "T1", laborHours: 0.18, materialCost: 12.00, laborCost: 8.64 },
    { description: "Slate tile 12x12", unit: "SF", laborCode: "T1", laborHours: 0.20, materialCost: 6.00, laborCost: 9.60 },
  ],
  "Tile Setting Materials": [
    { description: "Cement backer board 1/2\", 3x5 panel", unit: "SF", laborCode: "D1", laborHours: 0.04, materialCost: 0.85, laborCost: 1.68 },
    { description: "Modified thinset mortar (bag)", unit: "SF", laborCode: "G1", laborHours: 0.01, materialCost: 0.35, laborCost: 0.28 },
    { description: "Epoxy grout", unit: "SF", laborCode: "T1", laborHours: 0.02, materialCost: 1.50, laborCost: 0.96 },
    { description: "Sanded grout", unit: "SF", laborCode: "T1", laborHours: 0.01, materialCost: 0.25, laborCost: 0.48 },
    { description: "Waterproofing membrane", unit: "SF", laborCode: "D1", laborHours: 0.02, materialCost: 0.75, laborCost: 0.84 },
  ],
  // Flooring
  "Hardwood Flooring": [
    { description: "3/4\" solid oak flooring, unfinished", unit: "SF", laborCode: "B1", laborHours: 0.15, materialCost: 6.50, laborCost: 6.75 },
    { description: "3/4\" solid oak flooring, prefinished", unit: "SF", laborCode: "B1", laborHours: 0.12, materialCost: 9.00, laborCost: 5.40 },
    { description: "Engineered hardwood, click-lock", unit: "SF", laborCode: "B1", laborHours: 0.08, materialCost: 5.50, laborCost: 3.60 },
    { description: "Engineered hardwood, glue-down", unit: "SF", laborCode: "B1", laborHours: 0.12, materialCost: 7.00, laborCost: 5.40 },
    { description: "Hardwood floor refinishing", unit: "SF", laborCode: "B1", laborHours: 0.10, materialCost: 1.50, laborCost: 4.50 },
  ],
  "Luxury Vinyl": [
    { description: "LVP - luxury vinyl plank, glue-down", unit: "SF", laborCode: "B1", laborHours: 0.08, materialCost: 3.00, laborCost: 3.60 },
    { description: "LVP - luxury vinyl plank, click-lock", unit: "SF", laborCode: "B1", laborHours: 0.06, materialCost: 3.50, laborCost: 2.70 },
    { description: "LVT - luxury vinyl tile", unit: "SF", laborCode: "B1", laborHours: 0.08, materialCost: 4.00, laborCost: 3.60 },
    { description: "WPC/SPC rigid core flooring", unit: "SF", laborCode: "B1", laborHours: 0.06, materialCost: 4.50, laborCost: 2.70 },
  ],
  "Carpet": [
    { description: "Builder grade carpet", unit: "SF", laborCode: "G1", laborHours: 0.03, materialCost: 2.50, laborCost: 0.84 },
    { description: "Mid-grade carpet", unit: "SF", laborCode: "G1", laborHours: 0.03, materialCost: 4.00, laborCost: 0.84 },
    { description: "Premium carpet", unit: "SF", laborCode: "G1", laborHours: 0.04, materialCost: 6.00, laborCost: 1.12 },
    { description: "Carpet pad (6lb rebond)", unit: "SF", laborCode: "G1", laborHours: 0.01, materialCost: 0.50, laborCost: 0.28 },
    { description: "Carpet tile", unit: "SF", laborCode: "G1", laborHours: 0.04, materialCost: 3.50, laborCost: 1.12 },
  ],
  "Underlayment": [
    { description: "Plywood underlayment 1/2\"", unit: "SF", laborCode: "B1", laborHours: 0.03, materialCost: 1.25, laborCost: 1.35 },
    { description: "Plywood underlayment 3/4\"", unit: "SF", laborCode: "B1", laborHours: 0.04, materialCost: 1.75, laborCost: 1.80 },
    { description: "Cement board underlayment", unit: "SF", laborCode: "B1", laborHours: 0.05, materialCost: 1.00, laborCost: 2.25 },
    { description: "Floor leveling compound", unit: "SF", laborCode: "G1", laborHours: 0.02, materialCost: 0.50, laborCost: 0.56 },
  ],
  // Paint
  "Interior Paint": [
    { description: "Interior paint - builder grade", unit: "SF", laborCode: "PT", laborHours: 0.015, materialCost: 0.15, laborCost: 1.13 },
    { description: "Interior paint - premium", unit: "SF", laborCode: "PT", laborHours: 0.015, materialCost: 0.25, laborCost: 1.13 },
    { description: "Ceiling paint - flat white", unit: "SF", laborCode: "PT", laborHours: 0.018, materialCost: 0.12, laborCost: 1.35 },
    { description: "Accent wall - 2 coats", unit: "SF", laborCode: "PT", laborHours: 0.025, materialCost: 0.30, laborCost: 1.88 },
  ],
  "Primers & Sealers": [
    { description: "Interior primer", unit: "SF", laborCode: "PT", laborHours: 0.01, materialCost: 0.12, laborCost: 0.75 },
    { description: "Exterior primer", unit: "SF", laborCode: "PT", laborHours: 0.01, materialCost: 0.15, laborCost: 0.75 },
    { description: "Stain-blocking primer", unit: "SF", laborCode: "PT", laborHours: 0.012, materialCost: 0.25, laborCost: 0.90 },
    { description: "Bonding primer", unit: "SF", laborCode: "PT", laborHours: 0.01, materialCost: 0.20, laborCost: 0.75 },
  ],
  "Exterior Paint": [
    { description: "Exterior paint - standard", unit: "SF", laborCode: "PT", laborHours: 0.02, materialCost: 0.25, laborCost: 1.50 },
    { description: "Exterior paint - premium", unit: "SF", laborCode: "PT", laborHours: 0.02, materialCost: 0.35, laborCost: 1.50 },
    { description: "Exterior stain - semi-transparent", unit: "SF", laborCode: "PT", laborHours: 0.025, materialCost: 0.30, laborCost: 1.88 },
    { description: "Exterior stain - solid color", unit: "SF", laborCode: "PT", laborHours: 0.02, materialCost: 0.28, laborCost: 1.50 },
  ],
  "Stains & Finishes": [
    { description: "Wood stain - interior", unit: "SF", laborCode: "PT", laborHours: 0.02, materialCost: 0.20, laborCost: 1.50 },
    { description: "Polyurethane - satin", unit: "SF", laborCode: "PT", laborHours: 0.015, materialCost: 0.15, laborCost: 1.13 },
    { description: "Polyurethane - gloss", unit: "SF", laborCode: "PT", laborHours: 0.015, materialCost: 0.15, laborCost: 1.13 },
    { description: "Varnish - marine grade", unit: "SF", laborCode: "PT", laborHours: 0.02, materialCost: 0.35, laborCost: 1.50 },
  ],
};

async function main() {
  console.log("Starting comprehensive seed...");

  // Clear existing data
  await prisma.estimateLineItem.deleteMany();
  await prisma.lineItemVariantCost.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.room.deleteMany();
  await prisma.project.deleteMany();
  await prisma.specification.deleteMany();
  await prisma.lineItem.deleteMany();
  await prisma.materialVariant.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.division.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.laborCode.deleteMany();
  await prisma.areaModifier.deleteMany();

  // Create units
  console.log("Creating units...");
  for (const unit of UNITS) {
    await prisma.unit.create({ data: unit });
  }

  // Create labor codes
  console.log("Creating labor codes...");
  for (const lc of LABOR_CODES) {
    await prisma.laborCode.create({ data: lc });
  }

  // Create divisions
  console.log("Creating divisions...");
  for (let i = 0; i < DIVISIONS.length; i++) {
    await prisma.division.create({
      data: {
        ...DIVISIONS[i],
        sortOrder: i + 1,
      }
    });
  }

  // Create categories for Division 09 - Finishes
  console.log("Creating finishes categories...");
  const finishesDivision = await prisma.division.findUnique({
    where: { divisionCode: "09" }
  });
  
  if (!finishesDivision) throw new Error("Division 09 not found");

  for (let i = 0; i < FINISHES_CATEGORIES.length; i++) {
    const cat = FINISHES_CATEGORIES[i];
    const parentCategory = await prisma.category.create({
      data: {
        divisionId: finishesDivision.id,
        categoryName: cat.categoryName,
        sortOrder: i + 1,
      }
    });

    // Create subcategories
    for (let j = 0; j < cat.subcategories.length; j++) {
      const subcat = cat.subcategories[j];
      await prisma.category.create({
        data: {
          divisionId: finishesDivision.id,
          categoryName: subcat.categoryName,
          description: subcat.description,
          parentCategoryId: parentCategory.id,
          sortOrder: j + 1,
        }
      });
    }
  }

  // Create categories for Division 06 - Wood
  console.log("Creating wood categories...");
  const woodDivision = await prisma.division.findUnique({
    where: { divisionCode: "06" }
  });
  
  if (woodDivision) {
    for (let i = 0; i < WOOD_CATEGORIES.length; i++) {
      const cat = WOOD_CATEGORIES[i];
      const parentCategory = await prisma.category.create({
        data: {
          divisionId: woodDivision.id,
          categoryName: cat.categoryName,
          sortOrder: i + 1,
        }
      });

      for (let j = 0; j < cat.subcategories.length; j++) {
        const subcat = cat.subcategories[j];
        await prisma.category.create({
          data: {
            divisionId: woodDivision.id,
            categoryName: subcat.categoryName,
            description: subcat.description,
            parentCategoryId: parentCategory.id,
            sortOrder: j + 1,
          }
        });
      }
    }
  }

  // Create categories for Division 08 - Openings
  console.log("Creating openings categories...");
  const openingsDivision = await prisma.division.findUnique({
    where: { divisionCode: "08" }
  });
  
  if (openingsDivision) {
    for (let i = 0; i < OPENINGS_CATEGORIES.length; i++) {
      const cat = OPENINGS_CATEGORIES[i];
      const parentCategory = await prisma.category.create({
        data: {
          divisionId: openingsDivision.id,
          categoryName: cat.categoryName,
          sortOrder: i + 1,
        }
      });

      for (let j = 0; j < cat.subcategories.length; j++) {
        const subcat = cat.subcategories[j];
        await prisma.category.create({
          data: {
            divisionId: openingsDivision.id,
            categoryName: subcat.categoryName,
            description: subcat.description,
            parentCategoryId: parentCategory.id,
            sortOrder: j + 1,
          }
        });
      }
    }
  }

  // Create work items and line items for Finishes
  console.log("Creating finishes line items...");
  for (const [subcatName, items] of Object.entries(FINISHES_LINE_ITEMS)) {
    const category = await prisma.category.findFirst({
      where: { categoryName: subcatName }
    });

    if (!category) {
      console.log(`Category not found: ${subcatName}`);
      continue;
    }

    // Create a work item for this category
    const workItem = await prisma.workItem.create({
      data: {
        categoryId: category.id,
        workItemName: `${subcatName} - General`,
        workItemType: "task",
        sourcePublication: "National Construction Estimator",
        sourceYear: 2024,
      }
    });

    // Create line items
    for (const item of items) {
      const unit = await prisma.unit.findUnique({
        where: { unitCode: item.unit }
      });
      const laborCode = await prisma.laborCode.findUnique({
        where: { laborCode: item.laborCode }
      });

      if (!unit) {
        console.log(`Unit not found: ${item.unit}`);
        continue;
      }

      await prisma.lineItem.create({
        data: {
          workItemId: workItem.id,
          description: item.description,
          unitId: unit.id,
          laborCodeId: laborCode?.id || null,
          laborHours: item.laborHours,
          materialCost: item.materialCost,
          laborCost: item.laborCost,
          totalCost: item.materialCost + item.laborCost,
        }
      });
    }
  }

  // Create a sample project
  console.log("Creating sample project...");
  const project = await prisma.project.create({
    data: {
      name: "Sample Renovation Project",
      description: "A sample residential renovation project",
      clientName: "John Doe",
      clientEmail: "john@example.com",
      projectType: "renovation",
      status: "active",
    }
  });

  // Create sample rooms
  await prisma.room.createMany({
    data: [
      { projectId: project.id, name: "Living Room", roomType: "living", length: 15, width: 12, height: 8, floorArea: 180, wallArea: 432 },
      { projectId: project.id, name: "Kitchen", roomType: "kitchen", length: 12, width: 10, height: 8, floorArea: 120, wallArea: 352 },
      { projectId: project.id, name: "Master Bedroom", roomType: "bedroom", length: 14, width: 12, height: 8, floorArea: 168, wallArea: 416 },
      { projectId: project.id, name: "Bathroom", roomType: "bathroom", length: 8, width: 6, height: 8, floorArea: 48, wallArea: 224 },
    ]
  });

  console.log("Seed completed!");
  
  // Print summary
  const divisionCount = await prisma.division.count();
  const categoryCount = await prisma.category.count();
  const lineItemCount = await prisma.lineItem.count();
  const workItemCount = await prisma.workItem.count();
  
  console.log(`\n=== Summary ===`);
  console.log(`Divisions: ${divisionCount}`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Work Items: ${workItemCount}`);
  console.log(`Line Items: ${lineItemCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
