// Zustand store for conversation UI state
import { create } from 'zustand';

interface ConversationUIState {
  selectedConversationId: string | null;
  isComposerFocused: boolean;
  composerText: string;
  sidebarCollapsed: boolean;
  
  // Actions
  setSelectedConversationId: (id: string | null) => void;
  setComposerFocused: (focused: boolean) => void;
  setComposerText: (text: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  resetComposer: () => void;
}

export const useConversationStore = create<ConversationUIState>((set) => ({
  selectedConversationId: null,
  isComposerFocused: false,
  composerText: '',
  sidebarCollapsed: false,

  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  setComposerFocused: (focused) => set({ isComposerFocused: focused }),
  setComposerText: (text) => set({ composerText: text }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  resetComposer: () => set({ composerText: '', isComposerFocused: false }),
}));