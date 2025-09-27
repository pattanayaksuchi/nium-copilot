"""Pydantic request/response models used by the API."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatReq(BaseModel):
    message: str = Field(..., description="End-user query text.")
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional context payload passed straight through to the retriever.",
    )


class SearchReq(BaseModel):
    q: str = Field(..., description="Search query for the RAG index.")
    k: int = Field(default=5, ge=1, le=50, description="Maximum number of results to return.")


class ValidateReq(BaseModel):
    currency: str = Field(..., min_length=1, description="ISO currency code (e.g. USD).")
    country: str = Field(..., min_length=1, description="ISO country code (e.g. US).")
    method: Optional[str] = Field(
        default=None,
        description="Optional payout method (bank, wallet, proxy, card, cash).",
    )
    channel: Optional[str] = Field(
        default=None,
        description="Optional channel for the selected method (e.g. local, wire).",
    )
    payload: Dict[str, Any] = Field(..., description="Request payload to validate.")


class Citation(BaseModel):
    title: str
    url: str
    snippet: str


class ChatResp(BaseModel):
    answer: str
    citations: List[Citation]


# Conversation-related schemas
class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # 'user' or 'assistant'
    content: str
    citations: List[Citation] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages_count: int


class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    messages: List[Message] = []
    summary: Optional[str] = None

    @property
    def messages_count(self) -> int:
        return len(self.messages)

    def to_summary(self) -> ConversationSummary:
        return ConversationSummary(
            id=self.id,
            title=self.title,
            created_at=self.created_at,
            updated_at=self.updated_at,
            messages_count=self.messages_count
        )


class CreateConversationReq(BaseModel):
    title: Optional[str] = None


class CreateConversationResp(BaseModel):
    id: str
    title: str


class UpdateConversationReq(BaseModel):
    title: str


class SendMessageReq(BaseModel):
    content: str


class SendMessageResp(BaseModel):
    user_message: Message
    assistant_message: Message


__all__ = [
    "ChatReq",
    "SearchReq", 
    "ValidateReq",
    "Citation",
    "ChatResp",
    "Message",
    "Conversation",
    "ConversationSummary",
    "CreateConversationReq",
    "CreateConversationResp",
    "UpdateConversationReq",
    "SendMessageReq",
    "SendMessageResp",
]
