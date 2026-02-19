import { create } from 'zustand';
import type { Project, Room, Material, Labor, Estimate, LineItem } from './types';

interface AppState {
  // Active project
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  
  // Active estimate
  activeEstimate: Estimate | null;
  setActiveEstimate: (estimate: Estimate | null) => void;
  
  // Selected room for layout editor
  selectedRoom: Room | null;
  setSelectedRoom: (room: Room | null) => void;
  
  // Cart items for estimate building
  cartItems: (Material | Labor)[];
  addToCart: (item: Material | Labor, type: 'material' | 'labor') => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  
  // Line items for current estimate
  estimateLineItems: LineItem[];
  setEstimateLineItems: (items: LineItem[]) => void;
  addLineItem: (item: LineItem) => void;
  updateLineItem: (id: string, updates: Partial<LineItem>) => void;
  removeLineItem: (id: string) => void;
  
  // UI state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Search and filters
  materialSearch: string;
  setMaterialSearch: (search: string) => void;
  materialCategoryFilter: string;
  setMaterialCategoryFilter: (category: string) => void;
  
  laborSearch: string;
  setLaborSearch: (search: string) => void;
  laborTradeFilter: string;
  setLaborTradeFilter: (trade: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Active project
  activeProject: null,
  setActiveProject: (project) => set({ activeProject: project }),
  
  // Active estimate
  activeEstimate: null,
  setActiveEstimate: (estimate) => set({ activeEstimate: estimate }),
  
  // Selected room
  selectedRoom: null,
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  
  // Cart
  cartItems: [],
  addToCart: (item, type) => set((state) => {
    const existing = state.cartItems.find(i => i.id === item.id);
    if (existing) return state;
    return { cartItems: [...state.cartItems, { ...item, type }] };
  }),
  removeFromCart: (id) => set((state) => ({
    cartItems: state.cartItems.filter(i => i.id !== id)
  })),
  clearCart: () => set({ cartItems: [] }),
  
  // Line items
  estimateLineItems: [],
  setEstimateLineItems: (items) => set({ estimateLineItems: items }),
  addLineItem: (item) => set((state) => ({
    estimateLineItems: [...state.estimateLineItems, item]
  })),
  updateLineItem: (id, updates) => set((state) => ({
    estimateLineItems: state.estimateLineItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  removeLineItem: (id) => set((state) => ({
    estimateLineItems: state.estimateLineItems.filter(item => item.id !== id)
  })),
  
  // UI
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Search and filters
  materialSearch: '',
  setMaterialSearch: (search) => set({ materialSearch: search }),
  materialCategoryFilter: 'all',
  setMaterialCategoryFilter: (category) => set({ materialCategoryFilter: category }),
  
  laborSearch: '',
  setLaborSearch: (search) => set({ laborSearch: search }),
  laborTradeFilter: 'all',
  setLaborTradeFilter: (trade) => set({ laborTradeFilter: trade }),
}));
