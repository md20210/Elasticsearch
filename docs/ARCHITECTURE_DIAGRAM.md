# Elasticsearch Showcase - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)                        │
│                        Hosted on: Strato SFTP Server                         │
│                        URL: https://www.dabrock.info/elasticsearch/          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │   Showcase Tab       │  │   Import Data Tab    │  │  Analytics Tab   │  │
│  │  (Comparison UI)     │  │   (Profile Import)   │  │  (Metrics Viz)   │  │
│  ├──────────────────────┤  ├──────────────────────┤  ├──────────────────┤  │
│  │ - Query Input        │  │ - Text Paste Area    │  │ - KPI Cards      │  │
│  │ - LLM Provider Select│  │ - Drag & Drop Upload │  │ - Bar Charts     │  │
│  │ - Compare Button     │  │ - URL Crawler        │  │ - Pie Chart      │  │
│  │ - Results Display    │  │ - Import Button      │  │ - Line Chart     │  │
│  │ - Winner Highlight   │  │ - Clear All Button   │  │ - Query Table    │  │
│  │ - LLM Explanation    │  │                      │  │ - Clear All      │  │
│  └─────────┬────────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│            │                          │                        │             │
│            └──────────────────────────┼────────────────────────┘             │
│                                       │                                      │
│                              ┌────────▼─────────┐                            │
│                              │    API Client    │                            │
│                              │   (Axios + JWT)  │                            │
│                              └────────┬─────────┘                            │
└───────────────────────────────────────┼──────────────────────────────────────┘
                                        │
                         HTTPS + Bearer Token Authentication
                                        │
┌───────────────────────────────────────▼──────────────────────────────────────┐
│                   BACKEND API (FastAPI + Python 3.11)                         │
│                   Hosted on: Railway Cloud Platform                           │
│                   URL: https://general-backend-production-a734.up.railway.app │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                    FastAPI Endpoints (/elasticsearch/*)              │     │
│  ├─────────────────────────────────────────────────────────────────────┤     │
│  │                                                                       │     │
│  │  POST /compare-query         - Dual search + LLM evaluation          │     │
│  │  POST /profile               - Create/update user profile            │     │
│  │  GET  /profile               - Retrieve user profile                 │     │
│  │  GET  /rag-analytics         - Get analytics aggregations            │     │
│  │  DELETE /clear-analytics     - Clear all analytics data              │     │
│  │  POST /demo/generate         - Generate demo profiles                │     │
│  │  GET  /database-stats        - Database statistics                   │     │
│  │                                                                       │     │
│  └───────────────┬───────────────────────────────┬─────────────────────┘     │
│                  │                               │                            │
│    ┌─────────────▼──────────────┐    ┌──────────▼──────────────┐             │
│    │  RAG Search Services       │    │  Analytics & Logging    │             │
│    ├────────────────────────────┤    ├─────────────────────────┤             │
│    │ - pgvector_service.py      │    │ - rag_metrics_logger.py │             │
│    │ - elasticsearch_service.py │    │ - Logs to ES index      │             │
│    │ - embedding_service.py     │    │ - Aggregation queries   │             │
│    │ - llm_service.py           │    │ - Performance tracking  │             │
│    └──┬──────────────────┬──────┘    └─────────────────────────┘             │
│       │                  │                                                    │
│  ┌────▼─────┐    ┌──────▼─────┐                                              │
│  │ pgvector │    │Elasticsearch│                                              │
│  │ Service  │    │   Service   │                                              │
│  └────┬─────┘    └──────┬─────┘                                              │
│       │                  │                                                    │
└───────┼──────────────────┼────────────────────────────────────────────────────┘
        │                  │
        │                  │
┌───────▼──────────────────▼────────────────────────────────────────────────────┐
│                            DATA LAYER                                          │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────────────────────┐     ┌──────────────────────────────────┐  │
│  │  PostgreSQL + pgvector         │     │  Elasticsearch 7.17               │  │
│  │  (Railway Internal Service)    │     │  (Railway Internal Service)       │  │
│  ├────────────────────────────────┤     ├──────────────────────────────────┤  │
│  │                                │     │                                  │  │
│  │ Tables:                        │     │ Indices:                         │  │
│  │ ┌────────────────────────┐    │     │ ┌──────────────────────────┐    │  │
│  │ │ user_elastic_profiles  │    │     │ │ user_cvs                 │    │  │
│  │ ├────────────────────────┤    │     │ ├──────────────────────────┤    │  │
│  │ │ - id (UUID)            │    │     │ │ - user_id                │    │  │
│  │ │ - user_id (FK)         │    │     │ │ - cv_text (text)         │    │  │
│  │ │ - cv_text              │    │     │ │ - skills (text)          │    │  │
│  │ │ - cv_embedding         │    │     │ │ - experience (keyword)   │    │  │
│  │ │   (vector(768))        │    │     │ │ - cv_dense (kNN)         │    │  │
│  │ │ - skills               │    │     │ │ - updated_at             │    │  │
│  │ │ - experience_years     │    │     │ └──────────────────────────┘    │  │
│  │ │ - created_at           │    │     │                                  │  │
│  │ └────────────────────────┘    │     │ ┌──────────────────────────┐    │  │
│  │                                │     │ │ cv_rag_logs              │    │  │
│  │ Vector Operations:             │     │ ├──────────────────────────┤    │  │
│  │ • Cosine similarity            │     │ │ - query_text             │    │  │
│  │ • k-NN search (k=3)            │     │ │ - timestamp              │    │  │
│  │ • Pure semantic matching       │     │ │ - evaluation.pgvector_   │    │  │
│  │                                │     │ │   score                  │    │  │
│  └────────────────────────────────┘     │ │ - evaluation.elastic_    │    │  │
│                                         │ │   score                  │    │  │
│                                         │ │ - evaluation.winner      │    │  │
│                                         │ │ - pgvector.retrieval_    │    │  │
│                                         │ │   time_ms                │    │  │
│                                         │ │ - elasticsearch.         │    │  │
│                                         │ │   retrieval_time_ms      │    │  │
│                                         │ │ - llm_provider           │    │  │
│                                         │ └──────────────────────────┘    │  │
│                                         │                                  │  │
│                                         │ Hybrid Search Strategy:          │  │
│                                         │ • 70% BM25 keyword match         │  │
│                                         │ • 30% kNN vector similarity      │  │
│                                         │ • Fuzzy matching                 │  │
│                                         │ • Field boosting                 │  │
│                                         └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES & INTEGRATIONS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────┐         ┌─────────────────────────────────────┐ │
│  │   Grok API (X.AI)     │         │   Local Ollama (Llama 3.1 70B)      │ │
│  ├───────────────────────┤         ├─────────────────────────────────────┤ │
│  │ - LLM Evaluation      │         │ - GDPR-compliant evaluation         │ │
│  │ - Cloud-based         │         │ - On-premise deployment             │ │
│  │ - Fast response       │         │ - Full data privacy                 │ │
│  │ - API key required    │         │ - No external API calls             │ │
│  └───────────────────────┘         └─────────────────────────────────────┘ │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │   Sentence Transformers (all-MiniLM-L6-v2)                            │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ - 384-dimensional embeddings                                          │  │
│  │ - Semantic text representation                                        │  │
│  │ - Used for both pgvector and Elasticsearch kNN                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

### 1. User Query Comparison Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Enter question: "What database experience?"
     │ 2. Select LLM: "Grok" or "Local"
     │ 3. Click "Compare Both"
     ▼
┌─────────────────────┐
│  Showcase Component │
└─────────┬───────────┘
          │ 4. POST /elasticsearch/compare-query
          │    { question, provider }
          ▼
┌──────────────────────────────┐
│  FastAPI Backend             │
│  (compare_query_with_llm)    │
└──────────┬───────────────────┘
           │
           │ 5. Parallel execution:
           ├───────────────┬─────────────────┐
           ▼               ▼                 ▼
    ┌──────────┐   ┌──────────────┐   ┌────────────┐
    │ pgvector │   │ Elasticsearch│   │  Retrieve  │
    │  Search  │   │    Search    │   │   Profile  │
    └────┬─────┘   └──────┬───────┘   └─────┬──────┘
         │                │                  │
         │ 6. Generate embedding             │
         │    Query vector DB                │
         │    Return top 3 chunks            │
         │                │                  │
         │                │ 7. Hybrid search │
         │                │    70% BM25 + 30% kNN
         │                │    Return top 3 chunks
         │                │                  │
         └────────────────┴──────────────────┘
                          │
                          │ 8. Build context from chunks
                          ▼
                 ┌──────────────────┐
                 │  LLM Service     │
                 │  (Grok/Ollama)   │
                 └────────┬─────────┘
                          │ 9. Generate answers
                          │    - pgvector answer
                          │    - Elasticsearch answer
                          │
                          │ 10. Evaluate answers
                          │     - Score pgvector (0-100)
                          │     - Score Elasticsearch (0-100)
                          │     - Determine winner
                          │     - Generate explanation
                          ▼
                 ┌──────────────────┐
                 │ Log to Analytics │
                 │  (cv_rag_logs)   │
                 └────────┬─────────┘
                          │
                          │ 11. Return response
                          ▼
                 ┌──────────────────┐
                 │  Showcase UI     │
                 │  - Green box (winner)
                 │  - Red box (loser)
                 │  - Explanation
                 └──────────────────┘
```

### 2. Profile Import Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Drag & drop CV file OR
     │    Paste text OR
     │    Enter URL
     ▼
┌─────────────────────┐
│  AnalyzeJob         │
│  Component          │
└─────────┬───────────┘
          │ 2a. File: Extract text (PDF.js/mammoth)
          │ 2b. Text: Use directly
          │ 2c. URL: Crawl & extract
          │
          │ 3. POST /elasticsearch/profile?provider=grok
          │    { cv_text, cover_letter, homepage_url, linkedin_url }
          ▼
┌──────────────────────────────┐
│  Profile Service             │
└──────────┬───────────────────┘
           │
           │ 4. Generate embedding (384-dim vector)
           │
           ├───────────────┬─────────────────┐
           ▼               ▼                 ▼
    ┌──────────┐   ┌──────────────┐   ┌────────────┐
    │ pgvector │   │ Elasticsearch│   │ PostgreSQL │
    │  Index   │   │    Index     │   │   Table    │
    └──────────┘   └──────────────┘   └────────────┘
           │               │                 │
           │ Store vector  │ Store text +    │ Store metadata
           │ + metadata    │ hybrid index    │
           │               │                 │
           └───────────────┴─────────────────┘
                          │
                          │ 5. Return success
                          ▼
                 ┌──────────────────┐
                 │  UI Confirmation │
                 └──────────────────┘
```

### 3. Analytics Dashboard Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Open Analytics Tab
     │ 2. Auto-refresh every 30s
     ▼
┌─────────────────────────────┐
│  AnalyticsDashboard         │
│  Component                  │
└─────────┬───────────────────┘
          │ 3. GET /elasticsearch/rag-analytics
          ▼
┌──────────────────────────────┐
│  RAG Metrics Logger          │
│  (get_aggregations)          │
└──────────┬───────────────────┘
           │
           │ 4. Query cv_rag_logs index
           │
           ▼
    ┌─────────────────────────────────┐
    │  Elasticsearch Aggregations     │
    ├─────────────────────────────────┤
    │ • AVG pgvector_score            │
    │ • AVG elasticsearch_score       │
    │ • AVG retrieval_time_ms         │
    │ • Terms aggregation (winner)    │
    │ • Date histogram (time series)  │
    │ • Recent 20 queries (sorted)    │
    └────────┬────────────────────────┘
             │
             │ 5. Transform & return
             ▼
    ┌─────────────────────────────────┐
    │  Analytics Response             │
    ├─────────────────────────────────┤
    │ {                               │
    │   total_queries: 150,           │
    │   avg_pgvector_score: 82.5,     │
    │   avg_elasticsearch_score: 78.3,│
    │   avg_pgvector_latency: 45ms,   │
    │   avg_elasticsearch_latency: 67ms│
    │   winner_distribution: [        │
    │     {key: "pgvector", count: 85}│
    │     {key: "elasticsearch", count: 60}
    │     {key: "tie", count: 5}      │
    │   ],                            │
    │   recent_queries: [...]         │
    │ }                               │
    └────────┬────────────────────────┘
             │
             │ 6. Render visualizations
             ▼
    ┌─────────────────────────────────┐
    │  Recharts Visualization         │
    ├─────────────────────────────────┤
    │ • KPI Cards (4x)                │
    │ • Bar Chart (scores)            │
    │ • Pie Chart (win rate)          │
    │ • Bar Chart (latency)           │
    │ • Line Chart (trends)           │
    │ • Data Table (recent queries)   │
    └─────────────────────────────────┘
```

## Technology Stack Details

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 18.3.1 | UI component library |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Build Tool** | Vite | 7.3.0 | Fast dev server & bundler |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Charts** | Recharts | 2.x | Data visualization |
| **Icons** | Lucide React | Latest | Icon components |
| **HTTP Client** | Axios | 1.x | API communication |
| **PDF Processing** | PDF.js | Latest | PDF file parsing |
| **State Management** | React Hooks | Built-in | Local component state |

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | FastAPI | 0.104+ | High-performance async API |
| **Language** | Python | 3.11+ | Backend logic |
| **Database** | PostgreSQL | 15+ | Relational data storage |
| **Vector Extension** | pgvector | 0.5+ | Vector similarity search |
| **Search Engine** | Elasticsearch | 7.17.9 | Hybrid text+vector search |
| **Embeddings** | sentence-transformers | Latest | Text → Vector conversion |
| **LLM (Cloud)** | Grok API | Latest | AI evaluation service |
| **LLM (Local)** | Ollama + Llama 3.1 | 70B | Privacy-focused evaluation |
| **ORM** | SQLAlchemy | 2.x | Database abstraction |
| **Authentication** | FastAPI Users | Latest | JWT token management |

### Infrastructure

| Service | Platform | Purpose |
|---------|----------|---------|
| **Frontend Hosting** | Strato SFTP | Static file serving |
| **Backend API** | Railway | Cloud application hosting |
| **Database** | Railway PostgreSQL | Managed PostgreSQL instance |
| **Search** | Railway Elasticsearch | Managed Elasticsearch cluster |
| **CI/CD** | Git Push → Railway | Automatic deployment |

## Data Models

### PostgreSQL Schema

```sql
-- User Profiles Table
CREATE TABLE user_elastic_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    cv_text TEXT,
    cv_embedding vector(384),  -- pgvector extension
    cover_letter_text TEXT,
    homepage_url VARCHAR(2048),
    linkedin_url VARCHAR(2048),
    skills TEXT[],
    experience_years INTEGER,
    education TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vector Index for Fast k-NN Search
CREATE INDEX ON user_elastic_profiles
USING ivfflat (cv_embedding vector_cosine_ops)
WITH (lists = 100);
```

### Elasticsearch Mappings

```json
{
  "user_cvs": {
    "mappings": {
      "properties": {
        "user_id": { "type": "keyword" },
        "cv_text": {
          "type": "text",
          "analyzer": "standard",
          "fields": {
            "keyword": { "type": "keyword" }
          }
        },
        "cv_dense": {
          "type": "dense_vector",
          "dims": 384,
          "index": true,
          "similarity": "cosine"
        },
        "skills": {
          "type": "text",
          "analyzer": "standard"
        },
        "experience": { "type": "keyword" },
        "updated_at": { "type": "date" }
      }
    }
  },
  "cv_rag_logs": {
    "mappings": {
      "properties": {
        "query_text": { "type": "text" },
        "timestamp": { "type": "date" },
        "evaluation": {
          "properties": {
            "pgvector_score": { "type": "integer" },
            "elasticsearch_score": { "type": "integer" },
            "winner": { "type": "keyword" },
            "explanation": { "type": "text" }
          }
        },
        "pgvector": {
          "properties": {
            "retrieval_time_ms": { "type": "float" },
            "answer": { "type": "text" },
            "chunks": { "type": "nested" }
          }
        },
        "elasticsearch": {
          "properties": {
            "retrieval_time_ms": { "type": "float" },
            "answer": { "type": "text" },
            "chunks": { "type": "nested" }
          }
        },
        "llm_provider": { "type": "keyword" },
        "user_id": { "type": "keyword" }
      }
    }
  }
}
```

## Security Architecture

### Authentication Flow

```
User → Frontend → POST /demo/token → Backend
                                        ↓
                              Generate JWT token
                              (24h expiration)
                                        ↓
                            localStorage.setItem('auth_token', token)
                                        ↓
                        Axios interceptor adds:
                        Authorization: Bearer <token>
                                        ↓
                        All subsequent API requests
                        include JWT token
                                        ↓
                    FastAPI dependency validates:
                    - Token signature
                    - Expiration
                    - User existence
```

### Security Features

- **JWT Authentication**: Bearer token with 24h expiration
- **CORS Protection**: Restricted origins
- **Rate Limiting**: Prevent abuse (Railway built-in)
- **Input Validation**: Pydantic models
- **SQL Injection Protection**: SQLAlchemy ORM
- **XSS Protection**: React auto-escaping
- **HTTPS Only**: Enforced in production
- **Environment Variables**: Secrets in Railway vault

## Performance Optimization

### Frontend Optimizations

- **Code Splitting**: Vite automatic chunk splitting
- **Lazy Loading**: React.lazy for tab components
- **Memoization**: React.memo for expensive components
- **Debouncing**: Search input debounce (300ms)
- **Image Optimization**: SVG icons (scalable, small)
- **Bundle Size**: Gzipped ~465KB JS + ~7KB CSS

### Backend Optimizations

- **Async/Await**: FastAPI async handlers
- **Connection Pooling**: SQLAlchemy pool (10 connections)
- **Parallel Execution**: asyncio.gather for dual search
- **Index Optimization**:
  - pgvector IVFFlat index
  - Elasticsearch inverted indices
- **Caching**: Result caching for repeated queries
- **Batch Operations**: Bulk indexing for demo data

### Database Optimizations

- **pgvector Index**: IVFFlat for approximate k-NN
- **Elasticsearch Sharding**: Auto-sharding for scale
- **Query Optimization**: Explain plans reviewed
- **Vector Dimensions**: Reduced to 384 (vs 768) for speed

## Deployment Architecture

### Railway Services

```
┌──────────────────────────────────────┐
│  Railway Project: general-backend    │
├──────────────────────────────────────┤
│                                      │
│  Service 1: Backend API              │
│  ├─ Port: 8000                       │
│  ├─ Auto-deploy: main branch         │
│  ├─ Health check: /health            │
│  └─ Domain: *.up.railway.app         │
│                                      │
│  Service 2: PostgreSQL 15            │
│  ├─ Port: 5432 (internal)            │
│  ├─ Extensions: pgvector             │
│  └─ Volume: Persistent storage       │
│                                      │
│  Service 3: Elasticsearch 7.17       │
│  ├─ Port: 9200 (internal)            │
│  ├─ Memory: 2GB heap                 │
│  └─ Network: Private                 │
│                                      │
└──────────────────────────────────────┘
```

### Deployment Flow

```
Developer commits → GitHub → Railway detects push
                                   ↓
                           Build Docker image
                           (Python dependencies)
                                   ↓
                          Run database migrations
                                   ↓
                           Deploy new version
                           (zero-downtime)
                                   ↓
                           Health check passes
                                   ↓
                          Traffic routed to new
                          version
```

## Monitoring & Logging

### Application Logs

- **FastAPI Logging**: Structured JSON logs
- **Request Logging**: All API calls logged
- **Error Tracking**: Stack traces captured
- **Performance Metrics**: Latency tracking
- **Railway Logs**: Centralized log aggregation

### Analytics Tracking

- **Query Metrics**: All comparisons logged to cv_rag_logs
- **Aggregations**: Real-time Elasticsearch queries
- **Win Rates**: Tracked per search technology
- **Latency**: Retrieval time per search method
- **User Actions**: Profile imports, query submissions

## Future Architecture Enhancements

### Planned Improvements

1. **Redis Caching**: Cache frequent queries
2. **WebSocket Support**: Real-time updates
3. **CDN Integration**: CloudFront for static assets
4. **Database Replication**: Read replicas for scale
5. **A/B Testing**: Feature flags system
6. **Advanced Analytics**: Custom dashboards
7. **User Authentication**: Full user management
8. **API Rate Limiting**: Per-user quotas

---

**Document Version:** 1.0
**Last Updated:** 2025-01-02
**Author:** Michael Dabrock
**Project:** Elasticsearch Showcase
**Live URL:** https://www.dabrock.info/elasticsearch/
