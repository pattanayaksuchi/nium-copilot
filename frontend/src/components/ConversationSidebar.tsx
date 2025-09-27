'use client';

import { useState, useMemo } from 'react';
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
import { SearchInput } from './SearchInput';
import { ConversationListSkeleton } from './LoadingSkeleton';
import { useToast } from './Toast';

export function ConversationSidebar() {
  const { data: conversations = [], isLoading } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateConversation = useUpdateConversation();
  const { showToast } = useToast();
  
  const { 
    selectedConversationId, 
    setSelectedConversationId,
    sidebarCollapsed,
    setSidebarCollapsed 
  } = useConversationStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewChat = async () => {
    try {
      const newConversation = await createConversation.mutateAsync();
      setSelectedConversationId(newConversation.id);
      showToast({
        type: 'success',
        title: 'New conversation created',
        message: 'Ready to start chatting!'
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      showToast({
        type: 'error',
        title: 'Failed to create conversation',
        message: 'Please try again'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation.mutateAsync(id);
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
      }
      setShowDropdown(null);
      showToast({
        type: 'success',
        title: 'Conversation deleted',
        message: 'The conversation has been removed'
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      showToast({
        type: 'error',
        title: 'Failed to delete conversation',
        message: 'Please try again'
      });
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
      showToast({
        type: 'success',
        title: 'Conversation renamed',
        message: 'Title updated successfully'
      });
    } catch (error) {
      console.error('Failed to update conversation:', error);
      showToast({
        type: 'error',
        title: 'Failed to rename conversation',
        message: 'Please try again'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // Filter and group conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const groupedConversations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      Today: [] as typeof conversations,
      Yesterday: [] as typeof conversations,
      'This Week': [] as typeof conversations,
      Earlier: [] as typeof conversations,
    };

    filteredConversations.forEach(conv => {
      const convDate = new Date(conv.updated_at);
      if (convDate >= today) {
        groups.Today.push(conv);
      } else if (convDate >= yesterday) {
        groups.Yesterday.push(conv);
      } else if (convDate >= weekAgo) {
        groups['This Week'].push(conv);
      } else {
        groups.Earlier.push(conv);
      }
    });

    return groups;
  }, [filteredConversations]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-12 bg-panel border-r border-subtle flex flex-col items-center py-4 shadow-custom">
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="p-2 text-muted hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-custom hover-lift"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={handleNewChat}
          className="mt-4 p-2 text-muted hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-custom hover-lift"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-panel border-r border-subtle flex flex-col h-full shadow-custom">
      {/* Header */}
      <div className="p-4 border-b border-subtle bg-surface">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-1 text-muted hover:text-gray-900 hover:bg-gray-100 rounded transition-custom"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        
        <SearchInput 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search conversations..."
        />
        
        <button
          onClick={handleNewChat}
          disabled={createConversation.isPending || conversations.length >= 10}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          New Chat
          {conversations.length >= 10 && (
            <span className="text-xs opacity-90">(Max 10)</span>
          )}
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="p-4">
            <ConversationListSkeleton />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-muted">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium mb-1">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-sm text-subtle">
              {searchQuery ? 'Try a different search term' : 'Start a new chat to get started'}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-6">
            {Object.entries(groupedConversations).map(([group, groupConversations]) => {
              if (groupConversations.length === 0) return null;
              
              return (
                <div key={group}>
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-2">
                    {group}
                  </h3>
                  <div className="space-y-1">
                    {groupConversations.map((conversation) => (
                      <div key={conversation.id} className="relative">
                        <div
                          className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 ${
                            selectedConversationId === conversation.id
                              ? 'bg-blue-50 border border-blue-200 shadow-sm'
                              : 'hover:bg-surface hover:shadow-sm'
                          }`}
                          onClick={() => setSelectedConversationId(conversation.id)}
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            selectedConversationId === conversation.id
                              ? 'bg-blue-500'
                              : 'bg-gray-300 group-hover:bg-gray-400'
                          } transition-colors`} />
                          
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
                                className="w-full px-2 py-1 text-sm bg-surface border border-subtle rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-custom"
                                autoFocus
                              />
                            ) : (
                              <>
                                <h3 className="text-sm font-medium text-gray-900 truncate leading-5">
                                  {conversation.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-subtle mt-1">
                                  <span>{formatDate(conversation.updated_at)}</span>
                                  {conversation.messages_count > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{conversation.messages_count} messages</span>
                                    </>
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
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Dropdown Menu */}
                        {showDropdown === conversation.id && (
                          <div className="absolute right-2 top-12 z-20 bg-surface border border-subtle rounded-lg shadow-custom-lg py-1 w-36 animate-in slide-in-from-top-2 duration-150">
                            <button
                              onClick={() => handleEdit(conversation.id, conversation.title)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-custom"
                            >
                              <Edit2 className="w-3 h-3" />
                              Rename
                            </button>
                            <button
                              onClick={() => handleDelete(conversation.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-custom"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}