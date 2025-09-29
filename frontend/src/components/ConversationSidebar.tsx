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
      const newConversation = await createConversation.mutateAsync(undefined);
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
      <div className="conversation-sidebar-collapsed">
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="sidebar-control-btn"
        >
          <ChevronRight size={20} />
        </button>
        <button
          onClick={handleNewChat}
          className="sidebar-control-btn"
          style={{ marginTop: '16px' }}
          title="New Chat"
        >
          <Plus size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="conversation-sidebar" style={{ width: '320px' }}>
      {/* Header */}
      <div className="conversation-header">
        <div className="conversation-header-title">
          <span>Conversations</span>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="sidebar-control-btn"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="conversation-search"
        />
        
        <button
          onClick={handleNewChat}
          disabled={createConversation.isPending || conversations.length >= 10}
          className="new-chat-btn"
        >
          <Plus size={16} />
          New Chat
          {conversations.length >= 10 && (
            <span style={{ fontSize: '12px', opacity: 0.9 }}>(Max 10)</span>
          )}
        </button>
      </div>

      {/* Conversations List */}
      <div className="conversation-list">
        {isLoading ? (
          <div style={{ padding: '16px' }}>
            <ConversationListSkeleton />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="conversation-empty">
            <MessageSquare className="conversation-empty-icon" />
            <p className="conversation-empty-title">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="conversation-empty-description">
              {searchQuery ? 'Try a different search term' : 'Start a new chat to get started'}
            </p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedConversations).map(([group, groupConversations]) => {
              if (groupConversations.length === 0) return null;
              
              return (
                <div key={group} className="conversation-group">
                  <h3 className="conversation-group-title">
                    {group}
                  </h3>
                  <div>
                    {groupConversations.map((conversation) => (
                      <div key={conversation.id} className="conversation-item">
                        <div
                          className={`conversation-link ${
                            selectedConversationId === conversation.id ? 'conversation-link-active' : ''
                          }`}
                          onClick={() => setSelectedConversationId(conversation.id)}
                        >
                          <div className={`conversation-indicator ${
                            selectedConversationId === conversation.id 
                              ? 'conversation-indicator-active' 
                              : 'conversation-indicator-default'
                          }`} />
                          
                          <div className="conversation-details">
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
                                className="conversation-edit-input"
                                autoFocus
                              />
                            ) : (
                              <>
                                <h3 className="conversation-title">
                                  {conversation.title}
                                </h3>
                                <div className="conversation-meta">
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
                            className="conversation-menu-btn"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>

                        {/* Dropdown Menu */}
                        {showDropdown === conversation.id && (
                          <div className="conversation-dropdown">
                            <button
                              onClick={() => handleEdit(conversation.id, conversation.title)}
                              className="conversation-dropdown-item"
                            >
                              <Edit2 size={14} />
                              Rename
                            </button>
                            <button
                              onClick={() => handleDelete(conversation.id)}
                              className="conversation-dropdown-item conversation-dropdown-item-danger"
                            >
                              <Trash2 size={14} />
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