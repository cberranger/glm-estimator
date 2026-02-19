// Type definitions for the professional estimating application

export interface Division {
  id: string;
  divisionCode: string;
  divisionName: string;
  divisionTitle: string | null;
  sortOrder: number;
}

export interface Category {
  id: string;
  divisionId: string;
  categoryName: string;
  parentCategoryId: string | null;
  sortOrder: number;
  description: string | null;
}

export interface WorkItem {
  id: string;
  categoryId: string;
  workItemName: string;
  workItemType: string | null;
  scopeNotes: string | null;
  minimumJobCharge: number;
  sourcePublication: string;
  sourceYear: number;
}

export interface Subcategory {
  id: string;
  name: string;
  description: string | null;
}

export interface CategoryWithSubcategories {
  id: string;
  name: string;
  description: string | null;
  subcategories: Subcategory[];
}

export interface DivisionWithCategories {
  code: string;
  name: string;
  title: string | null;
  categories: CategoryWithSubcategories[];
}

export interface LineItemData {
  id: string;
  name: string;
  category: string;
  categoryId: string | null;
  parentCategory: string | null;
  parentCategoryId: string | null;
  division: string;
  divisionCode: string;
  unit: string;
  unitName: string;
  unitPrice: number;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  laborHours: number | null;
  laborCode: string | null;
  variants: LineItemVariant[];
}

export interface LineItemVariant {
  id: string;
  variantId: string;
  name: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  totalCost: number;
}

export interface LaborCodeData {
  id: string;
  laborCode: string;
  codeName: string;
  description: string | null;
  baseHourlyRate: number | null;
  isCrew: boolean;
  type: string;
}

export interface MaterialVariant {
  id: string;
  variantName: string;
  description: string | null;
  sortOrder: number;
}

export interface AreaModifier {
  id: string;
  modifierCode: string;
  modifierName: string;
  description: string | null;
  adjustmentType: string | null;
  adjustmentValue: number | null;
  appliesTo: string | null;
  isActive: boolean;
}

export interface Unit {
  id: string;
  unitCode: string;
  unitName: string;
  description: string | null;
  conversionFactorToBase: number | null;
  baseUnit: string | null;
}

// Project Management
export interface Project {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  address: string | null;
  projectType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
  rooms: Room[];
  estimates: Estimate[];
}

export interface Room {
  id: string;
  projectId: string;
  name: string;
  roomType: string;
  length: number;
  width: number;
  height: number;
  floorArea: number;
  wallArea: number;
  notes: string | null;
  positionX: number;
  positionY: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
}

export interface Estimate {
  id: string;
  projectId: string;
  areaModifierId: string | null;
  estimateName: string;
  projectName: string | null;
  projectLocation: string | null;
  estimateStatus: string;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalEquipmentCost: number;
  totalCost: number;
  profitMargin: number;
  taxRate: number;
  createdBy: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  areaModifier?: AreaModifier;
  lineItems?: EstimateLineItem[];
}

export interface EstimateLineItem {
  id: string;
  estimateId: string;
  lineItemId: string | null;
  variantId: string | null;
  roomId: string | null;
  quantity: number;
  unitId: string | null;
  overrideMaterialCost: number | null;
  overrideLaborCost: number | null;
  overrideEquipmentCost: number | null;
  lineTotalMaterialCost: number;
  lineTotalLaborCost: number;
  lineTotalEquipmentCost: number;
  lineTotal: number;
  notes: string | null;
  displayOrder: number;
  lineItem?: {
    id: string;
    description: string;
    materialCost: number;
    laborCost: number;
    equipmentCost: number;
    unit?: Unit;
    workItem?: {
      category?: {
        categoryName: string;
        division?: {
          divisionName: string;
        };
      };
    };
  };
  variant?: MaterialVariant;
  unit?: Unit;
  room?: Room;
}

export interface RoomLayout {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface EstimateSummary {
  materialsTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  subtotal: number;
  profit: number;
  tax: number;
  total: number;
}
