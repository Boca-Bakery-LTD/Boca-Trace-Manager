import { format, subDays, addDays } from "date-fns";

// Types
export type LotStatus = 'Released' | 'Quarantine' | 'Hold' | 'Consumed' | 'Recall';
export type LotType = 'Ingredient' | 'Packaging' | 'WIP' | 'FinishedGood';
export type Unit = 'kg' | 'g' | 'L' | 'pcs' | 'box' | 'pallet';

export interface Product {
  id: string;
  code: string;
  name: string;
  type: LotType;
  unit: Unit;
  shelfLifeDays: number;
  allergens: string[];
}

export interface Partner {
  id: string;
  name: string;
  type: 'Supplier' | 'Customer';
  code: string;
}

export interface Lot {
  id: string;
  lotNumber: string;
  productId: string;
  quantity: number;
  remainingQuantity: number;
  unit: Unit;
  status: LotStatus;
  location: string;
  productionDate: string; // ISO
  expiryDate: string; // ISO
  receivedFromId?: string; // Supplier ID if raw material
  producedFromIds?: string[]; // Parent Lot IDs if WIP/FG
  shippedToId?: string; // Customer ID
  notes?: string;
  qaCheck?: boolean;
}

// Seed Data
export const PRODUCTS: Product[] = [
  { id: 'P001', code: 'FLR-001', name: 'Organic Wheat Flour', type: 'Ingredient', unit: 'kg', shelfLifeDays: 365, allergens: ['Gluten'] },
  { id: 'P002', code: 'SGR-001', name: 'Cane Sugar', type: 'Ingredient', unit: 'kg', shelfLifeDays: 730, allergens: [] },
  { id: 'P003', code: 'EGG-001', name: 'Liquid Whole Eggs', type: 'Ingredient', unit: 'L', shelfLifeDays: 21, allergens: ['Egg'] },
  { id: 'P004', code: 'BTR-001', name: 'Unsalted Butter', type: 'Ingredient', unit: 'kg', shelfLifeDays: 90, allergens: ['Milk'] },
  { id: 'P005', code: 'BOX-001', name: 'Standard Cake Box', type: 'Packaging', unit: 'pcs', shelfLifeDays: 9999, allergens: [] },
  { id: 'W001', code: 'DGH-VAN', name: 'Vanilla Cake Batter', type: 'WIP', unit: 'kg', shelfLifeDays: 2, allergens: ['Gluten', 'Egg', 'Milk'] },
  { id: 'F001', code: 'CK-VAN-08', name: 'Vanilla Bean Cake 8"', type: 'FinishedGood', unit: 'box', shelfLifeDays: 7, allergens: ['Gluten', 'Egg', 'Milk'] },
  { id: 'F002', code: 'CK-CHOC-08', name: 'Chocolate Fudge Cake 8"', type: 'FinishedGood', unit: 'box', shelfLifeDays: 7, allergens: ['Gluten', 'Egg', 'Milk', 'Soy'] },
];

export const PARTNERS: Partner[] = [
  { id: 'S001', name: 'GrainCo Mills', type: 'Supplier', code: 'SUP-GRN' },
  { id: 'S002', name: 'SweetLife Sugars', type: 'Supplier', code: 'SUP-SWT' },
  { id: 'S003', name: 'FarmFresh Dairy', type: 'Supplier', code: 'SUP-FRM' },
  { id: 'S004', name: 'PackPro Solutions', type: 'Supplier', code: 'SUP-PCK' },
  { id: 'C001', name: 'Metro Market', type: 'Customer', code: 'CUST-MET' },
  { id: 'C002', name: 'City Cafe Chain', type: 'Customer', code: 'CUST-CCC' },
  { id: 'C003', name: 'Hotel Grand', type: 'Customer', code: 'CUST-HTL' },
];

const today = new Date();

export const LOTS: Lot[] = [
  // Raw Materials
  {
    id: 'L001', lotNumber: 'RM-FLR-20231020', productId: 'P001', quantity: 1000, remainingQuantity: 450, unit: 'kg',
    status: 'Released', location: 'Whse A-01', productionDate: format(subDays(today, 10), 'yyyy-MM-dd'), expiryDate: format(addDays(today, 355), 'yyyy-MM-dd'),
    receivedFromId: 'S001', qaCheck: true
  },
  {
    id: 'L002', lotNumber: 'RM-SGR-20231021', productId: 'P002', quantity: 500, remainingQuantity: 300, unit: 'kg',
    status: 'Released', location: 'Whse A-02', productionDate: format(subDays(today, 9), 'yyyy-MM-dd'), expiryDate: format(addDays(today, 720), 'yyyy-MM-dd'),
    receivedFromId: 'S002', qaCheck: true
  },
  {
    id: 'L003', lotNumber: 'RM-EGG-20231025', productId: 'P003', quantity: 200, remainingQuantity: 20, unit: 'L',
    status: 'Released', location: 'Cooler B-01', productionDate: format(subDays(today, 5), 'yyyy-MM-dd'), expiryDate: format(addDays(today, 16), 'yyyy-MM-dd'),
    receivedFromId: 'S003', qaCheck: true
  },
  {
    id: 'L004', lotNumber: 'RM-BTR-20231025', productId: 'P004', quantity: 100, remainingQuantity: 80, unit: 'kg',
    status: 'Hold', location: 'Cooler B-02', productionDate: format(subDays(today, 5), 'yyyy-MM-dd'), expiryDate: format(addDays(today, 85), 'yyyy-MM-dd'),
    receivedFromId: 'S003', qaCheck: false, notes: 'Pending QA temp check'
  },
  
  // WIP
  {
    id: 'L010', lotNumber: 'WIP-BAT-20231028-01', productId: 'W001', quantity: 150, remainingQuantity: 0, unit: 'kg',
    status: 'Consumed', location: 'Prod Line 1', productionDate: format(subDays(today, 2), 'yyyy-MM-dd'), expiryDate: format(today, 'yyyy-MM-dd'),
    producedFromIds: ['L001', 'L002', 'L003', 'L004'], qaCheck: true
  },

  // Finished Goods
  {
    id: 'L020', lotNumber: 'FG-CKV-20231028-A', productId: 'F001', quantity: 100, remainingQuantity: 20, unit: 'box',
    status: 'Released', location: 'Whse C-01', productionDate: format(subDays(today, 2), 'yyyy-MM-dd'), expiryDate: format(addDays(today, 5), 'yyyy-MM-dd'),
    producedFromIds: ['L010', 'L005'], qaCheck: true
  },
  {
    id: 'L021', lotNumber: 'FG-CKV-20231029-B', productId: 'F001', quantity: 120, remainingQuantity: 120, unit: 'box',
    status: 'Quarantine', location: 'Whse C-QA', productionDate: format(subDays(today, 1), 'yyyy-MM-dd'), expiryDate: format(addDays(today, 6), 'yyyy-MM-dd'),
    producedFromIds: ['L010'], qaCheck: false, notes: 'Metal detector fail test pending'
  },
];

// Helper to simulate "Shipment" by creating a record
export const SHIPMENTS = [
  { id: 'SH001', date: format(subDays(today, 1), 'yyyy-MM-dd'), customerId: 'C001', lotId: 'L020', quantity: 50 },
  { id: 'SH002', date: format(today, 'yyyy-MM-dd'), customerId: 'C002', lotId: 'L020', quantity: 30 },
];
