"""In-memory conversation storage with client isolation."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Dict, List, Optional

from .schemas import Conversation, Message


class ConversationStore:
    """In-memory storage for conversations, organized by client ID."""
    
    def __init__(self, max_conversations_per_client: int = 10):
        self.max_conversations_per_client = max_conversations_per_client
        # Structure: {client_id: {conversation_id: Conversation}}
        self._conversations: Dict[str, Dict[str, Conversation]] = {}
    
    def _validate_client_id(self, client_id: str) -> None:
        """Validate client ID format."""
        if not client_id or len(client_id) > 100:
            raise ValueError("Invalid client ID")
        if not re.match(r'^[a-zA-Z0-9_-]+$', client_id):
            raise ValueError("Client ID contains invalid characters")
    
    def get_conversations(self, client_id: str) -> List[Conversation]:
        """Get all conversations for a client, sorted by updated_at desc."""
        self._validate_client_id(client_id)
        client_conversations = self._conversations.get(client_id, {})
        conversations = list(client_conversations.values())
        return sorted(conversations, key=lambda c: c.updated_at, reverse=True)
    
    def get_conversation(self, client_id: str, conversation_id: str) -> Optional[Conversation]:
        """Get a specific conversation."""
        self._validate_client_id(client_id)
        return self._conversations.get(client_id, {}).get(conversation_id)
    
    def create_conversation(self, client_id: str, title: Optional[str] = None) -> Conversation:
        """Create a new conversation for a client."""
        self._validate_client_id(client_id)
        
        # Ensure client exists in storage
        if client_id not in self._conversations:
            self._conversations[client_id] = {}
        
        # Check conversation limit
        if len(self._conversations[client_id]) >= self.max_conversations_per_client:
            raise ValueError(f"Client has reached maximum of {self.max_conversations_per_client} conversations")
        
        # Create conversation with auto-generated title if none provided
        conversation = Conversation(title=title or "New Chat")
        self._conversations[client_id][conversation.id] = conversation
        
        return conversation
    
    def update_conversation(self, client_id: str, conversation_id: str, title: str) -> Optional[Conversation]:
        """Update conversation title."""
        conversation = self.get_conversation(client_id, conversation_id)
        if not conversation:
            return None
        
        conversation.title = title
        conversation.updated_at = datetime.utcnow()
        return conversation
    
    def delete_conversation(self, client_id: str, conversation_id: str) -> bool:
        """Delete a conversation."""
        self._validate_client_id(client_id)
        client_conversations = self._conversations.get(client_id, {})
        
        if conversation_id in client_conversations:
            del client_conversations[conversation_id]
            return True
        return False
    
    def add_message(self, client_id: str, conversation_id: str, message: Message) -> Optional[Conversation]:
        """Add a message to a conversation."""
        conversation = self.get_conversation(client_id, conversation_id)
        if not conversation:
            return None
        
        conversation.messages.append(message)
        conversation.updated_at = datetime.utcnow()
        
        # Auto-update title based on first user message
        if len(conversation.messages) == 1 and message.role == "user" and conversation.title == "New Chat":
            # Use first 50 chars of the message as title
            conversation.title = message.content[:50].strip()
            if len(message.content) > 50:
                conversation.title += "..."
        
        return conversation
    
    def get_conversation_context(self, client_id: str, conversation_id: str, max_turns: int = 6) -> List[Message]:
        """Get recent conversation context for RAG processing."""
        conversation = self.get_conversation(client_id, conversation_id)
        if not conversation:
            return []
        
        # Return last max_turns messages (user/assistant pairs)
        messages = conversation.messages[-max_turns*2:] if conversation.messages else []
        return messages


# Global conversation store instance
conversation_store = ConversationStore()