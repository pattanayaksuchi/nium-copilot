'use client';

import { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation } from '../hooks/useConversations';
import { useConversationStore } from '../store/conversationStore';

export function ConversationSidebar() {
  const { data: conversations = [], isLoading } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();
  
  const { 
    selectedConversationId, 
    setSelectedConversationId,
    sidebarCollapsed,
    setSidebarCollapsed 
  } = useConversationStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const handleNewChat = async () => {
    try {
      const newConversation = await createConversation.mutateAsync();
      setSelectedConversationId(newConversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation.mutateAsync(id);
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
      }
      setShowDropdown(null);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
    setShowDropdown(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    
    try {
      await updateConversation.mutateAsync({ 
        id: editingId, 
        title: editTitle.trim() 
      });
      setEditingId(null);
      setEditTitle('');
    } catch (error) {
      console.error('Failed to update conversation:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={handleNewChat}
          className="mt-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleNewChat}
          disabled={createConversation.isPending || conversations.length >= 10}
          className="mt-3 w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
          {conversations.length >= 10 && (
            <span className="text-xs">(Max 10)</span>
          )}
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a new chat to get started</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="relative">
                <div
                  className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversationId === conversation.id
                      ? 'bg-blue-100 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <MessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    {editingId === conversation.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="w-full px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <>
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatDate(conversation.updated_at)}</span>
                          {conversation.messages_count > 0 && (
                            <span>• {conversation.messages_count} messages</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(showDropdown === conversation.id ? null : conversation.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {showDropdown === conversation.id && (
                  <div className="absolute right-2 top-12 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32">
                    <button
                      onClick={() => handleEdit(conversation.id, conversation.title)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit2 className="w-3 h-3" />
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(conversation.id)}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}