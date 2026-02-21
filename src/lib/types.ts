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
  layers?: LayoutLayer[];
  elements?: LayoutElement[];
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
  elements?: LayoutElement[];
}

// Layout Layer System
export interface LayoutLayer {
  id: string;
  projectId: string;
  name: string;
  tradeType: string; // architectural, structural, electrical, plumbing, hvac, finishes
  color: string;
  isVisible: boolean;
  isLocked: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  elements?: LayoutElement[];
}

// Layout Elements
export interface LayoutElement {
  id: string;
  roomId: string | null;
  layerId: string;
  projectId: string;
  elementType: string; // door, window, stair, light, switch, outlet, fixture, etc.
  subType: string | null;
  category: string | null;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  properties: string | null; // JSON string
  color: string | null;
  icon: string | null;
  label: string | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  room?: Room;
  layer?: LayoutLayer;
}

// Element type definitions for the palette
export interface ElementTypeDefinition {
  type: string;
  subType: string;
  name: string;
  category: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultColor: string;
  layerType: string; // trade type this belongs to
  properties?: Record<string, unknown>;
}

// Default element types available in the palette
export const ELEMENT_TYPES: ElementTypeDefinition[] = [
  // Architectural - Access
  { type: 'door', subType: 'interior', name: 'Interior Door', category: 'access', icon: 'door', defaultWidth: 3, defaultHeight: 0.5, defaultColor: '#8B4513', layerType: 'architectural' },
  { type: 'door', subType: 'exterior', name: 'Exterior Door', category: 'access', icon: 'door', defaultWidth: 3.5, defaultHeight: 0.5, defaultColor: '#4A2C00', layerType: 'architectural' },
  { type: 'door', subType: 'double', name: 'Double Door', category: 'access', icon: 'door', defaultWidth: 6, defaultHeight: 0.5, defaultColor: '#8B4513', layerType: 'architectural' },
  { type: 'door', subType: 'sliding', name: 'Sliding Door', category: 'access', icon: 'door', defaultWidth: 6, defaultHeight: 0.5, defaultColor: '#6B4423', layerType: 'architectural' },
  
  // Architectural - Openings
  { type: 'window', subType: 'standard', name: 'Window', category: 'opening', icon: 'window', defaultWidth: 4, defaultHeight: 0.3, defaultColor: '#87CEEB', layerType: 'architectural' },
  { type: 'window', subType: 'picture', name: 'Picture Window', category: 'opening', icon: 'window', defaultWidth: 6, defaultHeight: 0.3, defaultColor: '#87CEEB', layerType: 'architectural' },
  { type: 'window', subType: 'bay', name: 'Bay Window', category: 'opening', icon: 'window', defaultWidth: 8, defaultHeight: 0.3, defaultColor: '#87CEEB', layerType: 'architectural' },
  
  // Architectural - Vertical Circulation
  { type: 'stair', subType: 'standard', name: 'Stairs', category: 'circulation', icon: 'stairs', defaultWidth: 4, defaultHeight: 10, defaultColor: '#D2691E', layerType: 'architectural' },
  { type: 'stair', subType: 'spiral', name: 'Spiral Stairs', category: 'circulation', icon: 'stairs', defaultWidth: 5, defaultHeight: 5, defaultColor: '#CD853F', layerType: 'architectural' },
  
  // Electrical - Lighting
  { type: 'light', subType: 'ceiling', name: 'Ceiling Light', category: 'lighting', icon: 'light', defaultWidth: 1, defaultHeight: 1, defaultColor: '#FFD700', layerType: 'electrical' },
  { type: 'light', subType: 'recessed', name: 'Recessed Light', category: 'lighting', icon: 'light', defaultWidth: 0.5, defaultHeight: 0.5, defaultColor: '#FFEC8B', layerType: 'electrical' },
  { type: 'light', subType: 'pendant', name: 'Pendant Light', category: 'lighting', icon: 'light', defaultWidth: 1, defaultHeight: 1, defaultColor: '#FFD700', layerType: 'electrical' },
  { type: 'light', subType: 'track', name: 'Track Light', category: 'lighting', icon: 'light', defaultWidth: 4, defaultHeight: 0.5, defaultColor: '#FFD700', layerType: 'electrical' },
  { type: 'light', subType: 'sconce', name: 'Wall Sconce', category: 'lighting', icon: 'light', defaultWidth: 0.5, defaultHeight: 0.5, defaultColor: '#FFD700', layerType: 'electrical' },
  
  // Electrical - Switches
  { type: 'switch', subType: 'single', name: 'Single Switch', category: 'switches', icon: 'switch', defaultWidth: 0.5, defaultHeight: 0.5, defaultColor: '#FFFFFF', layerType: 'electrical' },
  { type: 'switch', subType: 'double', name: 'Double Switch', category: 'switches', icon: 'switch', defaultWidth: 0.75, defaultHeight: 0.5, defaultColor: '#FFFFFF', layerType: 'electrical' },
  { type: 'switch', subType: 'dimmer', name: 'Dimmer Switch', category: 'switches', icon: 'switch', defaultWidth: 0.5, defaultHeight: 0.5, defaultColor: '#E8E8E8', layerType: 'electrical' },
  { type: 'switch', subType: 'smart', name: 'Smart Switch', category: 'switches', icon: 'switch', defaultWidth: 0.5, defaultHeight: 0.5, defaultColor: '#4169E1', layerType: 'electrical' },
  
  // Electrical - Outlets
  { type: 'outlet', subType: 'standard', name: 'Outlet', category: 'outlets', icon: 'outlet', defaultWidth: 0.5, defaultHeight: 0.5, defaultColor: '#FFFFFF', layerType: 'electrical' },
  { type: 'outlet', subType: 'gfci', name: 'GFCI Outlet', category: 'outlets', icon: 'outlet', defaultWidth: 0.5, defaultHeight: 0.5, defaultColor: '#FFA500', layerType: 'electrical' },
  { type: 'outlet', subType: 'double', name: 'Double Outlet', category: 'outlets', icon: 'outlet', defaultWidth: 0.75, defaultHeight: 0.5, defaultColor: '#FFFFFF', layerType: 'electrical' },
  { type: 'outlet', subType: 'usb', name: 'USB Outlet', category: 'outlets', icon: 'outlet', defaultWidth: 0.5, defaultHeight: 0.5, defaultColor: '#4169E1', layerType: 'electrical' },
  
  // Plumbing - Fixtures
  { type: 'fixture', subType: 'sink', name: 'Sink', category: 'plumbing', icon: 'sink', defaultWidth: 2, defaultHeight: 2, defaultColor: '#C0C0C0', layerType: 'plumbing' },
  { type: 'fixture', subType: 'toilet', name: 'Toilet', category: 'plumbing', icon: 'toilet', defaultWidth: 2.5, defaultHeight: 3, defaultColor: '#FFFFFF', layerType: 'plumbing' },
  { type: 'fixture', subType: 'bathtub', name: 'Bathtub', category: 'plumbing', icon: 'bathtub', defaultWidth: 3, defaultHeight: 6, defaultColor: '#FFFFFF', layerType: 'plumbing' },
  { type: 'fixture', subType: 'shower', name: 'Shower', category: 'plumbing', icon: 'shower', defaultWidth: 4, defaultHeight: 4, defaultColor: '#E0FFFF', layerType: 'plumbing' },
  { type: 'fixture', subType: 'washer', name: 'Washer', category: 'plumbing', icon: 'washer', defaultWidth: 2.5, defaultHeight: 2.5, defaultColor: '#E8E8E8', layerType: 'plumbing' },
  
  // HVAC
  { type: 'vent', subType: 'supply', name: 'Supply Vent', category: 'hvac', icon: 'vent', defaultWidth: 1, defaultHeight: 1, defaultColor: '#808080', layerType: 'hvac' },
  { type: 'vent', subType: 'return', name: 'Return Vent', category: 'hvac', icon: 'vent', defaultWidth: 1.5, defaultHeight: 1.5, defaultColor: '#696969', layerType: 'hvac' },
  { type: 'thermostat', subType: 'standard', name: 'Thermostat', category: 'hvac', icon: 'thermostat', defaultWidth: 0.5, defaultHeight: 0.5, defaultColor: '#FFFFFF', layerType: 'hvac' },
  
  // Furniture/Equipment (optional layer)
  { type: 'furniture', subType: 'cabinet', name: 'Cabinet', category: 'furniture', icon: 'cabinet', defaultWidth: 3, defaultHeight: 2, defaultColor: '#8B4513', layerType: 'finishes' },
  { type: 'furniture', subType: 'counter', name: 'Counter', category: 'furniture', icon: 'counter', defaultWidth: 6, defaultHeight: 2, defaultColor: '#D2691E', layerType: 'finishes' },
];

// Default layers for new projects
export const DEFAULT_LAYERS: Omit<LayoutLayer, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'elements'>[] = [
  { name: 'Architectural', tradeType: 'architectural', color: '#8B4513', isVisible: true, isLocked: false, sortOrder: 0 },
  { name: 'Structural', tradeType: 'structural', color: '#4A4A4A', isVisible: true, isLocked: false, sortOrder: 1 },
  { name: 'Electrical', tradeType: 'electrical', color: '#FFD700', isVisible: true, isLocked: false, sortOrder: 2 },
  { name: 'Plumbing', tradeType: 'plumbing', color: '#1E90FF', isVisible: true, isLocked: false, sortOrder: 3 },
  { name: 'HVAC', tradeType: 'hvac', color: '#808080', isVisible: true, isLocked: false, sortOrder: 4 },
  { name: 'Finishes', tradeType: 'finishes', color: '#D2691E', isVisible: true, isLocked: false, sortOrder: 5 },
];

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
