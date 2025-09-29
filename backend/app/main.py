"""FastAPI application exposing retrieval, chat, and validation endpoints."""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware

from . import rag, schema_lookup, schemas, settings, validator
from .conversation_store import conversation_store

app = FastAPI(title="Nium Developer Copilot", version="0.1.0")

allow_origins = [settings.FRONTEND_ORIGIN]
allow_all = settings.FRONTEND_ORIGIN == "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    settings.ensure_directories()


def get_client_id(x_client_id: str = Header(None)) -> str:
    """Extract and validate client ID from headers."""
    if not x_client_id:
        raise HTTPException(status_code=400, detail="X-Client-Id header is required")
    return x_client_id


@app.get("/")
def root() -> Dict[str, Any]:
    """Root endpoint providing API information and status."""
    return {
        "title": "Nium Developer Copilot API",
        "version": "0.1.0", 
        "status": "running",
        "description": "AI-powered assistant for Nium integration teams",
        "features": [
            "Instant payout playbooks",
            "Validation guardrails", 
            "Dynamic examples",
            "Docs-aware chat functionality"
        ],
        "endpoints": {
            "health": "/health",
            "search": "POST /search", 
            "chat": "POST /chat",
            "validate": "POST /validate",
            "conversations": "GET /conversations",
            "create_conversation": "POST /conversations",
            "send_message": "POST /conversations/{id}/messages",
            "docs": "/docs"
        },
        "usage": {
            "search": {
                "method": "POST",
                "url": "/search",
                "body": {"q": "search query", "k": 5},
                "description": "Search documentation using hybrid retrieval"
            },
            "chat": {
                "method": "POST", 
                "url": "/chat",
                "body": {"message": "your question"},
                "description": "Get AI-powered answers with citations"
            }
        }
    }


@app.get("/health")
def health() -> Dict[str, bool]:
    return {"ok": True}


@app.post("/search")
def search(payload: schemas.SearchReq) -> Dict[str, Any]:
    results = rag.hybrid_search(payload.q, k=payload.k)
    simplified = [
        {
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "snippet": item.get("snippet", item.get("text", "")),
        }
        for item in results
    ]
    return {"results": simplified[: payload.k]}


@app.post("/chat", response_model=schemas.ChatResp)
def chat(payload: schemas.ChatReq) -> schemas.ChatResp:
    schema_answer = (
        schema_lookup.answer_create_payout_query(payload.message)
        or schema_lookup.answer_validation_query(payload.message)
        or schema_lookup.answer_mandatory_difference_query(payload.message)
        or schema_lookup.answer_required_fields_query(payload.message)
        or schema_lookup.answer_remittance_template_query(payload.message)
        or schema_lookup.answer_payout_methods_query(payload.message)
        or schema_lookup.answer_regex_query(payload.message)
        or schema_lookup.answer_proxy_query(payload.message)
    )
    if schema_answer:
        citations = [
            schemas.Citation(
                title=cit.get("title", ""),
                url=cit.get("url", ""),
                snippet=cit.get("snippet", "")
            )
            for cit in schema_answer.get("citations", [])
        ]
        return schemas.ChatResp(
            answer=schema_answer["answer"],
            citations=citations,
        )

    chunks = rag.hybrid_search(payload.message, k=30)
    answer = rag.synthesize_answer(payload.message, chunks)
    if not answer:
        raise HTTPException(status_code=500, detail="Unable to generate answer.")
    citations = []
    citations_data = answer.get("citations", [])
    if isinstance(citations_data, list):
        citations = [
            schemas.Citation(
                title=cit.get("title", "") if isinstance(cit, dict) else "",
                url=cit.get("url", "") if isinstance(cit, dict) else "",
                snippet=cit.get("snippet", "") if isinstance(cit, dict) else ""
            )
            for cit in citations_data
        ]
    return schemas.ChatResp(answer=str(answer.get("answer", "")), citations=citations)


@app.post("/validate")
def validate(payload: schemas.ValidateReq) -> Dict[str, Any]:
    return validator.validate_payload(
        payload.payload,
        payload.currency,
        payload.country,
        method=payload.method,
        channel=payload.channel,
    )


# Conversation Management Endpoints

@app.get("/conversations")
def list_conversations(client_id: str = Depends(get_client_id)) -> List[schemas.ConversationSummary]:
    """Get all conversations for a client."""
    try:
        conversations = conversation_store.get_conversations(client_id)
        return [conv.to_summary() for conv in conversations]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/conversations")
def create_conversation(
    request: schemas.CreateConversationReq,
    client_id: str = Depends(get_client_id)
) -> schemas.CreateConversationResp:
    """Create a new conversation."""
    try:
        conversation = conversation_store.create_conversation(client_id, request.title)
        return schemas.CreateConversationResp(id=conversation.id, title=conversation.title)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/conversations/{conversation_id}")
def get_conversation(
    conversation_id: str,
    client_id: str = Depends(get_client_id)
) -> schemas.Conversation:
    """Get a specific conversation with all messages."""
    conversation = conversation_store.get_conversation(client_id, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.patch("/conversations/{conversation_id}")
def update_conversation(
    conversation_id: str,
    request: schemas.UpdateConversationReq,
    client_id: str = Depends(get_client_id)
) -> schemas.ConversationSummary:
    """Update conversation title."""
    conversation = conversation_store.update_conversation(client_id, conversation_id, request.title)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation.to_summary()


@app.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    client_id: str = Depends(get_client_id)
) -> Dict[str, str]:
    """Delete a conversation."""
    success = conversation_store.delete_conversation(client_id, conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted successfully"}


@app.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: str,
    request: schemas.SendMessageReq,
    client_id: str = Depends(get_client_id)
) -> schemas.SendMessageResp:
    """Send a message in a conversation and get AI response."""
    # Check if conversation exists
    conversation = conversation_store.get_conversation(client_id, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create user message
    user_message = schemas.Message(
        role="user",
        content=request.content
    )
    
    # Add user message to conversation
    conversation_store.add_message(client_id, conversation_id, user_message)
    
    # First try schema-based answers (same as /chat endpoint)
    schema_answer = (
        schema_lookup.answer_create_payout_query(request.content)
        or schema_lookup.answer_validation_query(request.content)
        or schema_lookup.answer_mandatory_difference_query(request.content)
        or schema_lookup.answer_required_fields_query(request.content)
        or schema_lookup.answer_remittance_template_query(request.content)
        or schema_lookup.answer_payout_methods_query(request.content)
        or schema_lookup.answer_regex_query(request.content)
        or schema_lookup.answer_proxy_query(request.content)
    )
    
    if schema_answer:
        answer = schema_answer
    else:
        # Fall back to context-aware RAG if no schema match
        context_messages = conversation_store.get_conversation_context(client_id, conversation_id)
        context_prompt = _build_contextual_prompt(request.content, context_messages)
        chunks = rag.hybrid_search(context_prompt, k=30)
        answer = rag.synthesize_answer(context_prompt, chunks)
    
    if not answer:
        raise HTTPException(status_code=500, detail="Unable to generate answer.")
    
    # Process citations
    citations = []
    citations_data = answer.get("citations", [])
    if isinstance(citations_data, list):
        citations = [
            schemas.Citation(
                title=cit.get("title", "") if isinstance(cit, dict) else "",
                url=cit.get("url", "") if isinstance(cit, dict) else "",
                snippet=cit.get("snippet", "") if isinstance(cit, dict) else ""
            )
            for cit in citations_data
        ]
    
    # Create assistant message
    assistant_message = schemas.Message(
        role="assistant",
        content=str(answer.get("answer", "")),
        citations=citations
    )
    
    # Add assistant message to conversation
    conversation_store.add_message(client_id, conversation_id, assistant_message)
    
    return schemas.SendMessageResp(
        user_message=user_message,
        assistant_message=assistant_message
    )


def _build_contextual_prompt(current_message: str, context_messages: List[schemas.Message]) -> str:
    """Build a contextual prompt including conversation history."""
    if not context_messages:
        return current_message
    
    # Build context from recent messages (exclude current one)
    context_parts = []
    for msg in context_messages[-6:]:  # Last 6 messages for context
        role_prefix = "User" if msg.role == "user" else "Assistant"
        context_parts.append(f"{role_prefix}: {msg.content}")
    
    # Combine context with current message
    context_text = "\n".join(context_parts)
    contextual_prompt = f"""Based on our conversation history:
{context_text}

Current question: {current_message}

Please provide a comprehensive answer considering the conversation context."""
    
    return contextual_prompt


__all__ = ["app"]
