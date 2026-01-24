import { create } from 'zustand';
import { format } from 'date-fns';

// --- Types ---

export type Role = 'Admin' | 'Manager' | 'Staff';
export type StorageCondition = 'Ambient' | 'Chilled' | 'Frozen';
export type Unit = 'kg' | 'g' | 'L' | 'pcs' | 'bag' | 'box';

export interface User {
  id: string;
  name: string;
  role: Role;
  pin?: string;
  active: boolean;
}

export interface IngredientType {
  id: string;
  name: string;
  defaultUnit: Unit;
  storage: StorageCondition;
}

// "Received Lot" - Raw material entering the bakery
export interface ReceivedLot {
  id: string;
  ingredientTypeId: string;
  batchCode: string;
  receivedAt: string; // ISO
  bestBefore: string; // ISO
  receivedByUserId: string;
  quantity?: number;
  unit?: Unit;
  notes?: string;
  storage: StorageCondition;
}

// "Daily Log Entry" - Snapshot of what batch code is "active" for an ingredient on a given day
export interface DailyLogEntry {
  id: string;
  date: string; // yyyy-MM-dd
  ingredientTypeId: string;
  activeReceivedLotId: string; // The lot currently in use
  updatedAt: string; // ISO
}

// "Batch" - Dough or Filling created from ingredients
export interface Batch {
  id: string;
  code: string; // e.g. DOUGH-101
  type: 'Dough' | 'Filling';
  name: string; // e.g. "White Sourdough"
  createdAt: string; // ISO
  createdByUserId: string;
  ingredientLotIds: string[]; // Links to ReceivedLots used
}

// "Production Run" - Final Product creation
export interface ProductionRun {
  id: string;
  productName: string; // e.g. "White Loaf Sliced"
  sku: string;
  productBatchCode: string; // ddmmyy
  runDate: string; // ISO
  createdByUserId: string;
  quantity: number;
  doughBatchIds: string[]; // Links to Dough Batches
  fillingBatchIds: string[]; // Links to Filling Batches
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  userId: string;
}

// --- Store State ---

interface BakeryStore {
  users: User[];
  ingredientTypes: IngredientType[];
  receivedLots: ReceivedLot[];
  dailyLog: DailyLogEntry[];
  batches: Batch[];
  productionRuns: ProductionRun[];
  auditLog: AuditEvent[];

  // Actions
  addUser: (user: Omit<User, 'id'>) => void;
  addReceivedLot: (lot: Omit<ReceivedLot, 'id'>) => void;
  updateDailyLog: (date: string, ingredientTypeId: string, lotId: string) => void;
  createBatch: (batch: Omit<Batch, 'id'>) => void;
  createProductionRun: (run: Omit<ProductionRun, 'id'>) => void;
  addAuditLog: (action: string, details: string, userId: string) => void;
  
  // Helpers
  getLotsForIngredient: (typeId: string) => ReceivedLot[];
  getActiveLotForDate: (date: string, typeId: string) => ReceivedLot | undefined;
}

// --- Mock Data Initialization ---

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'John Doe', role: 'Manager', active: true, pin: '1234' },
  { id: 'u2', name: 'Sarah Baker', role: 'Staff', active: true, pin: '0000' },
  { id: 'u3', name: 'Mike Mixer', role: 'Staff', active: true, pin: '1111' },
];

const INITIAL_INGREDIENTS: IngredientType[] = [
  { id: 'ing1', name: 'Strong White Flour', defaultUnit: 'kg', storage: 'Ambient' },
  { id: 'ing2', name: 'Wholemeal Flour', defaultUnit: 'kg', storage: 'Ambient' },
  { id: 'ing3', name: 'Yeast (Fresh)', defaultUnit: 'g', storage: 'Chilled' },
  { id: 'ing4', name: 'Salt', defaultUnit: 'kg', storage: 'Ambient' },
  { id: 'ing5', name: 'Water', defaultUnit: 'L', storage: 'Ambient' },
  { id: 'ing6', name: 'Butter', defaultUnit: 'kg', storage: 'Chilled' },
  { id: 'ing7', name: 'Sugar', defaultUnit: 'kg', storage: 'Ambient' },
  { id: 'ing8', name: 'Strawberry Jam', defaultUnit: 'kg', storage: 'Ambient' },
  { id: 'ing9', name: 'Custard Mix', defaultUnit: 'kg', storage: 'Ambient' },
];

// Some seed lots
const INITIAL_LOTS: ReceivedLot[] = [
  { id: 'lot1', ingredientTypeId: 'ing1', batchCode: 'FL-23-001', receivedAt: new Date().toISOString(), bestBefore: '2024-12-31', receivedByUserId: 'u1', storage: 'Ambient', quantity: 1000 },
  { id: 'lot2', ingredientTypeId: 'ing3', batchCode: 'YST-99', receivedAt: new Date().toISOString(), bestBefore: '2024-02-01', receivedByUserId: 'u1', storage: 'Chilled', quantity: 50 },
  { id: 'lot3', ingredientTypeId: 'ing4', batchCode: 'SLT-A1', receivedAt: new Date().toISOString(), bestBefore: '2025-01-01', receivedByUserId: 'u1', storage: 'Ambient', quantity: 200 },
];

export const useBakeryStore = create<BakeryStore>((set, get) => ({
  users: INITIAL_USERS,
  ingredientTypes: INITIAL_INGREDIENTS,
  receivedLots: INITIAL_LOTS,
  dailyLog: [],
  batches: [],
  productionRuns: [],
  auditLog: [],

  addUser: (user) => set((state) => ({ 
    users: [...state.users, { ...user, id: Math.random().toString(36).substr(2, 9) }] 
  })),

  addReceivedLot: (lot) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      receivedLots: [...state.receivedLots, { ...lot, id }],
    }));
    get().addAuditLog('RECEIVE_GOODS', `Received ${lot.batchCode}`, lot.receivedByUserId);
  },

  updateDailyLog: (date, ingredientTypeId, lotId) => {
    set((state) => {
      // Remove existing entry for this day/ingredient if exists
      const filtered = state.dailyLog.filter(e => !(e.date === date && e.ingredientTypeId === ingredientTypeId));
      return {
        dailyLog: [...filtered, {
          id: Math.random().toString(36).substr(2, 9),
          date,
          ingredientTypeId,
          activeReceivedLotId: lotId,
          updatedAt: new Date().toISOString()
        }]
      };
    });
    get().addAuditLog('UPDATE_DAILY_LOG', `Set active lot for ing ${ingredientTypeId} to ${lotId}`, 'current-user');
  },

  createBatch: (batch) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      batches: [...state.batches, { ...batch, id }]
    }));
    get().addAuditLog('CREATE_BATCH', `Created ${batch.type} batch ${batch.code}`, batch.createdByUserId);
  },

  createProductionRun: (run) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      productionRuns: [...state.productionRuns, { ...run, id }]
    }));
    get().addAuditLog('CREATE_PRODUCTION', `Created run ${run.productBatchCode} for ${run.sku}`, run.createdByUserId);
  },

  addAuditLog: (action, details, userId) => {
    set((state) => ({
      auditLog: [{
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        action,
        details,
        userId
      }, ...state.auditLog]
    }));
  },

  getLotsForIngredient: (typeId) => {
    return get().receivedLots.filter(l => l.ingredientTypeId === typeId);
  },

  getActiveLotForDate: (date, typeId) => {
    const state = get();
    // 1. Check exact date match
    const entry = state.dailyLog.find(e => e.date === date && e.ingredientTypeId === typeId);
    if (entry) return state.receivedLots.find(l => l.id === entry.activeReceivedLotId);

    // 2. If no entry, find the "latest" lot received before or on this date (Fallback logic)
    // For simplicity in this mock, we'll just return the most recently received lot
    const lots = state.receivedLots
      .filter(l => l.ingredientTypeId === typeId)
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
    
    return lots[0];
  }
}));
