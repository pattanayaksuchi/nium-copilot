// React Query hooks for conversation data
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ConversationSummary, Conversation, SendMessageResponse } from '../lib/api';

// Query keys
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (filters: string) => [...conversationKeys.lists(), { filters }] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
};

// Get all conversations
export function useConversations() {
  return useQuery({
    queryKey: conversationKeys.lists(),
    queryFn: () => apiClient.getConversations(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get single conversation with messages
export function useConversation(id: string | null) {
  return useQuery({
    queryKey: conversationKeys.detail(id || ''),
    queryFn: () => apiClient.getConversation(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Create conversation
export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (title?: string) => 
      apiClient.createConversation({ title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

// Update conversation (rename)
export function useUpdateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      apiClient.updateConversation(id, { title }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conversationKeys.detail(variables.id) });
    },
  });
}

// Delete conversation
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteConversation(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) });
    },
  });
}

// Send message
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      apiClient.sendMessage(conversationId, { content }),
    onSuccess: (data, variables) => {
      // Update the conversation detail with new messages
      queryClient.setQueryData(
        conversationKeys.detail(variables.conversationId),
        (old: Conversation | undefined) => {
          if (!old) return old;
          return {
            ...old,
            messages: [...old.messages, data.user_message, data.assistant_message],
            updated_at: new Date().toISOString(),
          };
        }
      );
      // Invalidate conversations list to update message count
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}