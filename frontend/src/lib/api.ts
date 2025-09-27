// API client for conversation management
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types matching backend schemas
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface Citation {
  title: string;
  url: string;
  snippet: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages_count: number;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
  summary?: string;
}

export interface CreateConversationRequest {
  title?: string;
}

export interface UpdateConversationRequest {
  title: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  user_message: Message;
  assistant_message: Message;
}

// Get or create client ID
function getClientId(): string {
  if (typeof window === 'undefined') return 'ssr-client';
  
  try {
    let clientId = localStorage.getItem('nium-client-id');
    if (!clientId) {
      clientId = uuidv4();
      localStorage.setItem('nium-client-id', clientId);
    }
    console.log('Using client ID:', clientId);
    return clientId;
  } catch (error) {
    console.warn('localStorage not accessible, using fallback client ID:', error);
    return `fallback-${uuidv4()}`;
  }
}

// API client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const clientId = getClientId();

    console.log('Making request to:', url, 'with client ID:', clientId);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId,
        ...options.headers,
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', response.status, error);
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Conversation management
  async getConversations(): Promise<ConversationSummary[]> {
    return this.request<ConversationSummary[]>('/conversations');
  }

  async createConversation(data: CreateConversationRequest): Promise<{id: string; title: string}> {
    return this.request<{id: string; title: string}>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/conversations/${id}`);
  }

  async updateConversation(id: string, data: UpdateConversationRequest): Promise<ConversationSummary> {
    return this.request<ConversationSummary>(`/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteConversation(id: string): Promise<{message: string}> {
    return this.request<{message: string}>(`/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);