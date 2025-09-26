# Nium Developer Copilot

## Overview

Nium Developer Copilot is an internal assistant designed to help integration teams ship payouts faster across corridors. It combines a FastAPI backend with a Next.js frontend to provide instant payout playbooks, validation guardrails, dynamic examples, and docs-aware chat functionality.

The system offers corridor-specific guidance by answering questions about payout flows, validating payloads against JSON schemas, generating ready-to-run cURL templates, and providing operational support through a RAG (Retrieval Augmented Generation) pipeline that indexes official Nium documentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**Backend Architecture (FastAPI)**
- **RAG Pipeline**: Hybrid retrieval system combining FAISS dense search with BM25 sparse search for document retrieval
- **Validation Engine**: Corridor-aware JSON Schema validation for payout payloads with field-level error reporting
- **Data Ingestion**: Automated crawling and processing of Nium documentation with nightly index rebuilds
- **API Design**: RESTful endpoints for chat, search, and validation operations with CORS support

**Frontend Architecture (Next.js App Router)**
- **Chat Interface**: Real-time conversation UI with citation rendering and code snippet copy functionality
- **Validation Workspace**: Interactive payload validation with corridor-specific schema checking
- **Component Structure**: React-based UI with TypeScript support and responsive design
- **Authentication**: API key-based authentication without customer data handling

**Data Processing Pipeline**
- **Document Crawling**: BeautifulSoup-based web scraping of approved documentation sources
- **Text Processing**: Markdown conversion with readability extraction and chunking strategies
- **Embedding Generation**: Sentence-transformers for semantic search with FAISS indexing
- **Schema Management**: Excel-based validation rules converted to JSON Schema format

**Retrieval System Design**
- **Hybrid Search**: Combines dense (FAISS) and sparse (BM25) retrieval for comprehensive results
- **Answer Synthesis**: GPT-powered response generation with structured citation format
- **Context Awareness**: Maintains conversation context with corridor-specific details
- **Performance Optimization**: LRU caching and batch processing for efficient operations

## External Dependencies

**AI/ML Services**
- OpenAI GPT API for answer synthesis and chat responses
- Sentence Transformers (all-MiniLM-L6-v2) for text embeddings
- FAISS for dense vector similarity search
- BM25 for sparse keyword-based retrieval

**Data Processing Libraries**
- BeautifulSoup4 and readability-lxml for web scraping and content extraction
- Pandas and OpenPyXL for Excel validation sheet processing
- NumPy for numerical operations and vector handling
- Markdownify for HTML to Markdown conversion

**Web Framework Dependencies**
- FastAPI with Uvicorn for backend API server
- Next.js 14 with React 18 for frontend application
- HTTPx for asynchronous HTTP requests
- CORS middleware for cross-origin resource sharing

**Development Tools**
- TypeScript for type safety in frontend development
- ESLint and Prettier for code formatting and linting
- Poetry/pip for Python dependency management
- Node.js package management with npm

**Data Storage**
- File-based storage for documentation corpus and metadata
- Pickle serialization for search indexes and embeddings
- JSON Schema files for validation rules
- Local directory structure for build artifacts and cached data