import { supabase } from "../lib/supabase";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface BackendHighlight {
  id: string
  category: 'general' | 'important' | 'thoughts'
  position: {
    pageNumber: number
    boundingRect: {
      x1: number
      y1: number
      x2: number
      y2: number
      width: number
      height: number
    }
    rects: Array<{
      x1: number
      y1: number
      x2: number
      y2: number
      width: number
      height: number
    }>
  }
  content: {
    text: string
  }
}

export interface ChatResponse {
  message: ChatMessage
  highlights?: BackendHighlight[]
  session_id: string
}

export interface UploadResponse {
  id: string
  filename: string
  message: string
  supabase_url?: string
}

// Helper function to transform backend highlight format to frontend format
function transformHighlight(backendHighlight: BackendHighlight) {
  const { pageNumber, boundingRect, rects } = backendHighlight.position;

  return {
    ...backendHighlight,
    position: {
      boundingRect: {
        ...boundingRect,
        pageNumber: pageNumber,
      },
      rects: rects.map((rect) => ({
        ...rect,
        pageNumber: pageNumber,
      })),
      pageNumber: pageNumber,
    },
  };
}

// API Functions
export const apiService = {
  // Health checks
  async checkHealth(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health/`)
    if (!response.ok) throw new Error('Health check failed')
    return response.json()
  },

  async checkAIStatus(): Promise<{ status: string; model: string }> {
    const response = await fetch(`${API_BASE_URL}/health/ai-status`)
    if (!response.ok) throw new Error('AI status check failed')
    return response.json()
  },

  // File operations
  async uploadPDF(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token
    
    if (!token) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    })

    if (!response.ok) throw new Error('File upload failed')
    return response.json()
  },

  // Chat operations
  async sendTextMessage(
    message: string, 
    pdfId?: string, 
    sessionId?: string
  ): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        pdf_id: pdfId,
        session_id: sessionId,
      }),
    })

    if (!response.ok) throw new Error('Chat request failed')
    const data = await response.json()
    
    // Transform highlights if they exist
    if (data.highlights) {
      data.highlights = data.highlights.map(transformHighlight)
    }
    
    return data
  },

  async createSession(pdfId: string): Promise<{ session_id: string }> {
    const response = await fetch(`${API_BASE_URL}/chat/session?pdf_id=${pdfId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) throw new Error('Session creation failed')
    return response.json()
  },

  async getChatHistory(sessionId: string): Promise<{ messages: ChatMessage[] }> {
    const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`)
    if (!response.ok) throw new Error('Failed to get chat history')
    return response.json()
  },

  // Download operations
  async downloadPDF(pdfId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/download/${pdfId}`)
    if (!response.ok) throw new Error('Failed to download PDF')
    return response.blob()
  },

  // LiveKit operations
  async getLiveKitToken(payload: { pdf_id?: string }): Promise<{ token: string; url: string }> {
    const response = await fetch(`${API_BASE_URL}/livekit/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Failed to get LiveKit token');
    }
    return response.json();
  },

  async getUserProfile(): Promise<any> {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;

    if (!token) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }
    return response.json();
  }
} 