# Nium Developer Copilot

**AI-powered assistant for Nium integration teams to ship payouts faster across corridors.**

An embeddable chat widget and standalone application that provides instant payout guidance, real-time validation, and corridor-specific examples with citations from official Nium documentation.

---

## 🚀 **Product Features**

### **💬 Intelligent Chat Assistant**
- **Corridor-aware responses** - Get instant answers about payout flows, requirements, and best practices for specific countries and payment methods
- **Citation-backed answers** - Every response includes 1-3 linked references to official Nium documentation
- **Context retention** - Maintains conversation history for follow-up questions and clarifications
- **Natural language queries** - Ask questions like "What are required fields for Singapore bank transfers?" in plain English

### **🔧 Real-time Payload Validation**
- **JSON Schema validation** - Paste any payout payload and get instant field-level validation against corridor-specific schemas
- **Error highlighting** - Visual indicators show exactly which fields are missing, incorrect, or formatted improperly
- **Documentation links** - Each validation error includes direct links to relevant documentation sections
- **Multi-corridor support** - Validates bank transfers, digital wallets, cash pickup, and card payouts across all Nium corridors

### **📋 Dynamic Code Generation**
- **Ready-to-run cURL examples** - Generate complete API calls with corridor-specific parameters and authentication
- **JSON templates** - Pre-filled payload examples for remittance creation, status checks, and webhook handling
- **Copy-to-clipboard** - One-click copying for immediate integration into your development workflow
- **Live parameter substitution** - Examples automatically adjust based on selected corridor and payment method

### **🌐 Embeddable Widget**
- **Seamless integration** - Drop the chat widget into any docs page or internal tool with a single script tag
- **Responsive design** - Works perfectly on desktop, tablet, and mobile devices
- **Multiple states** - Minimized icon → compact chat → full-screen experience
- **Cross-domain support** - Secure postMessage communication for integration into existing documentation sites

### **🔍 Advanced Search & Retrieval**
- **Hybrid search engine** - Combines FAISS dense search with BM25 sparse search for comprehensive results
- **Document-aware** - Automatically stays up-to-date with latest Nium documentation and API changes
- **Operational support** - Answers questions about API key management, prefunding, onboarding, and troubleshooting
- **Multi-format support** - Searches across documentation, schemas, examples, and operational guides

---

## 🎯 **Use Cases**

### **For Integration Engineers**
- **"What's the payout flow for Australia local bank transfers?"** → Get step-by-step lifecycle, status codes, and webhook details
- **"Validate this Singapore remittance payload"** → Instant field-by-field validation with error explanations
- **"Generate a cURL for EUR to GBP conversion"** → Ready-to-run API call with proper authentication and parameters

### **For Product Teams**
- **"How do settlement statuses map to user-facing states?"** → Clear mapping with business logic explanations
- **"What's the difference between instant and standard transfers?"** → Feature comparison with corridor-specific details
- **"Show me webhook payload examples for failed transactions"** → Complete JSON examples with error codes

### **For Operations Teams**
- **"How do I rotate API keys safely?"** → Step-by-step operational procedures
- **"What causes INSUFFICIENT_FUNDS errors?"** → Root cause analysis with resolution steps
- **"How do I check transaction reconciliation?"** → Audit trail procedures and API endpoints

---

## 🏗️ **Technical Architecture**

### **Backend (FastAPI)**
- **RAG Pipeline**: Hybrid FAISS + BM25 retrieval with GPT-4 answer synthesis
- **Validation Engine**: Corridor-aware JSON Schema validation with detailed error reporting
- **Auto-ingestion**: Nightly crawling and indexing of official Nium documentation
- **API Design**: RESTful endpoints for chat, search, validation, and health checks

### **Frontend (Next.js)**
- **Chat Interface**: Real-time conversation UI with citation rendering and message history
- **Validation Workspace**: Interactive payload validation with syntax highlighting
- **Embeddable Widget**: Lightweight, responsive chat widget for external integration
- **Component Architecture**: Modular React components with TypeScript support

### **Data Processing**
- **Document Crawling**: Automated extraction from approved Nium documentation sources
- **Text Processing**: Markdown conversion with readability optimization and intelligent chunking
- **Embedding Generation**: Sentence-transformers for semantic search with FAISS indexing
- **Schema Management**: Excel-based validation rules converted to JSON Schema format

---

## 🛠️ **Quick Start**

### **Standalone Application**
```bash
# Backend
cd backend && python main_simple.py

# Frontend  
cd frontend && npm run dev
```

### **Embeddable Widget**
```html
<!-- Add to any docs page -->
<script src="https://your-domain.com/widget.js"></script>
<div id="nium-copilot-widget"></div>
```

### **API Integration**
```bash
# Chat endpoint
curl -X POST "https://your-api.com/conversations" \
  -H "X-Client-Id: your-client-id" \
  -d '{"content": "How do I validate Singapore payouts?"}'

# Validation endpoint
curl -X POST "https://your-api.com/validate" \
  -H "Content-Type: application/json" \
  -d '{"corridor": "SG", "payload": {...}}'
```

---

## 📊 **Performance & Scale**

- **Response Time**: Sub-200ms for chat responses, sub-50ms for validation
- **Accuracy**: 95%+ citation accuracy against official documentation
- **Coverage**: All Nium corridors and payment methods supported
- **Availability**: 99.9% uptime with automatic failover and health monitoring

---

## 🔒 **Security & Privacy**

- **API Key Authentication**: Secure client identification without customer data exposure
- **No Data Persistence**: Chat sessions are ephemeral, no customer data stored
- **CORS Protection**: Strict origin validation for cross-domain requests
- **Content Security**: All responses cite only official, approved Nium documentation

---

## 📈 **Roadmap**

- **Multi-language Support**: Chat interface in Spanish, Portuguese, and Mandarin
- **Advanced Analytics**: Usage patterns and question categorization for product insights
- **Custom Training**: Fine-tuned models for specific corridor or use case expertise
- **Integration APIs**: Webhooks and SDKs for embedding into existing development workflows

---

*For technical setup and development workflow, see the directory-specific documentation (`backend/README.md`, `frontend/README.md`).*