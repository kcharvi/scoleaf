import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { API_BASE_URL } from '../services/api'
import type { CustomHighlight, FilterCategory } from '../types/highlights'

export type AppMode = 'text' | 'speech'
export type ModelStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface AppState {
  // App mode
  currentMode: AppMode
  setCurrentMode: (mode: AppMode) => void
  
  // PDF handling
  pdfFile: File | null
  pdfUrl: string | null
  uploadedFileId: string | null
  setPdfFile: (file: File | null) => void
  setPdfUrl: (url: string | null) => void
  setUploadedFileId: (id: string | null) => void
  
  // Highlights
  highlights: CustomHighlight[]
  addHighlight: (highlight: CustomHighlight, isManual?: boolean) => void
  updateHighlight: (id: string, updates: Partial<CustomHighlight>) => void
  removeHighlight: (id: string) => void
  clearHighlights: () => void
  selectedCategory: FilterCategory
  setSelectedCategory: (category: FilterCategory) => void
  
  // Model status
  modelStatus: ModelStatus
  setModelStatus: (status: ModelStatus) => void
  checkBackendStatus: () => Promise<void>
  
  // Chat & Session Management
  currentSessionId: string | null
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>
  addMessage: (role: 'user' | 'assistant', content: string) => void
  resetConversation: () => void
  startNewChat: () => void
  createNewSession: (sessionId?: string) => void
  
  // UI state
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // App mode
      currentMode: 'text',
      setCurrentMode: (mode) => set({ currentMode: mode }),
      
      // PDF handling
      pdfFile: null,
      pdfUrl: null,
      uploadedFileId: null,
      setPdfFile: (file) => set({ pdfFile: file }),
      setPdfUrl: (url) => set({ pdfUrl: url }),
      setUploadedFileId: (id) => set({ uploadedFileId: id }),
      
      // Highlights
      highlights: [],
      addHighlight: (highlight, isManual = false) => {
        set((state) => {
          // For AI-generated highlights, the backend provides PDF-native coordinates.
          // For manual highlights, the library provides viewport coordinates and handles the conversion itself.
          // The `usePdfCoordinates` flag tells the library not to transform the coordinates.
          const processedHighlight = {
            ...highlight,
            position: {
              ...highlight.position,
              usePdfCoordinates: !isManual,
            },
          };

          // Avoid adding duplicate highlights
          if (state.highlights.some((h) => h.id === processedHighlight.id)) {
            return { highlights: state.highlights };
          }
          return { highlights: [...state.highlights, processedHighlight] };
        });
      },
      updateHighlight: (id, updates) => {
        const updatedHighlights = get().highlights.map(h => h.id === id ? { ...h, ...updates } : h)
        set({ highlights: updatedHighlights })
        console.log('Updated highlight:', id, 'Total highlights:', updatedHighlights.length)
      },
      removeHighlight: (id) => {
        const filteredHighlights = get().highlights.filter(h => h.id !== id)
        set({ highlights: filteredHighlights })
        console.log('Removed highlight:', id, 'Total highlights:', filteredHighlights.length)
      },
      clearHighlights: () => {
        set({ highlights: [] })
        console.log('Cleared all highlights')
      },
      selectedCategory: 'all',
      setSelectedCategory: (category) => {
        set({ selectedCategory: category })
        console.log('Selected category changed to:', category)
      },
      
      // Model status
      modelStatus: 'disconnected',
      setModelStatus: (status) => set({ modelStatus: status }),
      checkBackendStatus: async () => {
        try {
          set({ modelStatus: 'connecting' })
          const response = await fetch(`${API_BASE_URL}/health/ai-status`)
          if (response.ok) {
            const data = await response.json()
            set({ modelStatus: data.status === 'connected' ? 'connected' : 'error' })
          } else {
            set({ modelStatus: 'error' })
          }
        } catch (error) {
          console.error('Backend connection failed:', error)
          set({ modelStatus: 'disconnected' })
        }
      },
      
      // Chat & Session Management
      currentSessionId: null,
      messages: [],
      addMessage: (role, content) => {
        const newMessage = {
          id: Date.now().toString(),
          role,
          content,
          timestamp: new Date()
        }
        set({ messages: [...get().messages, newMessage] })
      },
      resetConversation: () => {
        set({ 
          messages: [], 
        })
        console.log('Conversation reset.')
      },
      startNewChat: () => {
        set({
          messages: [],
          currentSessionId: null,
          pdfFile: null,
          pdfUrl: null,
          uploadedFileId: null,
          highlights: [],
        })
        console.log('Started new chat. All state cleared.')
      },
      createNewSession: (sessionId?: string) => {
        const newSessionId = sessionId || `session_${Date.now()}`
        set({ 
          currentSessionId: newSessionId,
          messages: []
        })
        console.log('Created new session:', newSessionId)
      },
      
      // UI state
      isSidebarCollapsed: false,
      toggleSidebar: () => set({ isSidebarCollapsed: !get().isSidebarCollapsed }),
    }),
    {
      name: 'pdftalks-storage',
      partialize: (state) => ({ 
        highlights: state.highlights,
        selectedCategory: state.selectedCategory,
        currentMode: state.currentMode,
        // NOTE: Removed messages from persistence so they clear properly
      }),
    }
  )
) 