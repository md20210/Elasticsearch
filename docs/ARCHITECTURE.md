# Architecture Documentation

## System Overview

The Elasticsearch Showcase is a full-stack web application with a React frontend and FastAPI backend, demonstrating the comparison between vector-based (ChromaDB) and keyword-based (Elasticsearch) search for CV/job matching.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ AnalyzeJob   │  │ResultsChroma │  │ ResultsElastic   │  │
│  │ Component    │  │DB Component  │  │ Component        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                  │                   │             │
│         └──────────────────┴───────────────────┘             │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │   api.ts    │                          │
│                    │  (Axios)    │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTPS + JWT Token
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Backend (FastAPI on Railway)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         /elasticsearch/* Endpoints                    │  │
│  │  ┌───────────┐  ┌──────────┐  ┌────────────────┐    │  │
│  │  │ /profile  │  │ /analyze │  │ /parse-doc     │    │  │
│  │  └─────┬─────┘  └────┬─────┘  └────────────────┘    │  │
│  └────────┼─────────────┼──────────────────────────────┘  │
│           │             │                                   │
│    ┌──────▼─────────────▼──────┐                           │
│    │ Elasticsearch Service     │                           │
│    │ - CV parsing with LLM     │                           │
│    │ - Job analysis            │                           │
│    │ - Comparison logic        │                           │
│    └──────┬──────────────┬─────┘                           │
│           │              │                                  │
│  ┌────────▼────┐    ┌───▼──────────┐                      │
│  │  ChromaDB   │    │ Elasticsearch│                      │
│  │  (Vectors)  │    │  (Keywords)  │                      │
│  └─────────────┘    └──────────────┘                      │
│           │              │                                  │
│  ┌────────▼──────────────▼─────┐                           │
│  │     PostgreSQL Database      │                          │
│  │  - user_elastic_profiles     │                          │
│  │  - elastic_job_analyses      │                          │
│  └──────────────────────────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Application Initialization
```
User loads page → App.tsx useEffect → initAuth() → GET /demo/token
                                                         ↓
                                    JWT token stored in localStorage
                                                         ↓
                                    Axios interceptor adds token to all requests
```

### 2. CV Upload and Profile Creation
```
User uploads CV file → handleFileUpload() → Parse file (PDF.js/mammoth/backend)
                                                         ↓
                                            Text extracted from file
                                                         ↓
                            POST /elasticsearch/profile?provider=grok
                                    (CV text, cover letter, URLs)
                                                         ↓
                                        LLM parses CV → extracts:
                                        - Skills
                                        - Experience (years)
                                        - Education
                                        - Location
                                        - Salary expectations
                                                         ↓
                                    Create embeddings with ChromaDB
                                                         ↓
                                    Store in user_elastic_profiles table
```

### 3. Job Analysis
```
User pastes job description → Clicks "Analyze & Compare"
                                         ↓
                        POST /elasticsearch/analyze
                        (job description, job URL, provider)
                                         ↓
                            Retrieve user profile from DB
                                         ↓
                    ┌────────────────────┴────────────────────┐
                    ▼                                          ▼
        ChromaDB Semantic Search                  Elasticsearch Keyword Search
        - Generate job embedding                   - Index job description
        - Vector similarity search                 - BM25 scoring
        - Find semantically similar CVs            - Keyword matching
                    │                                          │
                    └────────────────────┬────────────────────┘
                                         ▼
                            LLM analyzes fit and generates:
                            - Overall fit score
                            - Detailed category breakdown
                            - Matched/missing skills
                            - Recommendations
                                         ↓
                            Store in elastic_job_analyses table
                                         ▼
                            Return results to frontend
                                         ▼
                        Display in ResultsChromaDB & ResultsElastic tabs
```

## Component Architecture

### Frontend Components

#### App.tsx
- **Purpose**: Main application container
- **Responsibilities**:
  - Initialize authentication on load
  - Manage tab navigation (Analyze / ChromaDB / Elastic)
  - Pass results between components
  - Handle analyze callback from AnalyzeJob

#### AnalyzeJob.tsx
- **Purpose**: CV and job description input form
- **Responsibilities**:
  - File upload handling for CV, cover letter, job description
  - Parse multiple file formats (.txt, .doc, .docx, .pdf)
  - URL loading with CORS error handling
  - Call backend analyze endpoint
  - Provider selection (Grok/Anthropic/Ollama)

#### ResultsChromaDB.tsx
- **Purpose**: Display ChromaDB vector search results
- **Responsibilities**:
  - Show similarity scores
  - Display matched skills
  - Show vector embeddings visualization

#### ResultsElastic.tsx
- **Purpose**: Display Elasticsearch keyword search results
- **Responsibilities**:
  - Show BM25 relevance scores
  - Display keyword matches
  - Compare with ChromaDB results

### Backend Services

#### ElasticsearchService (elasticsearch_showcase.py)
```python
Key Methods:
- create_or_update_profile(): Parse CV with LLM, store in DB and ChromaDB
- analyze_job(): Compare job against CV using both search methods
- parse_doc_file(): Extract text from legacy .doc files
- get_profile(): Retrieve user's CV profile
```

#### LLMGateway (llm_gateway.py)
```python
Key Methods:
- generate(): Call Grok/Anthropic/Ollama APIs
- parse_cv(): Extract structured data from CV text
- analyze_fit(): Generate detailed fit analysis
```

#### ChromaDB Integration
```python
- Collection: "cv_profiles"
- Embedding model: all-MiniLM-L6-v2
- Metadata: skills, experience_years, education, location
```

#### Elasticsearch Integration
```python
- Index: "cv_profiles"
- Mapping: text fields with keyword sub-fields
- Query: multi_match with BM25 scoring
```

## Database Schema

### user_elastic_profiles
```sql
CREATE TABLE user_elastic_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    cv_text TEXT,
    parsed_cv JSONB,  -- {skills: [], experience_years: int, education: str, ...}
    cover_letter_text TEXT,
    homepage_url TEXT,
    linkedin_url TEXT,
    chromadb_id TEXT,
    elasticsearch_doc_id TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### elastic_job_analyses
```sql
CREATE TABLE elastic_job_analyses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    job_description TEXT,
    job_url TEXT,
    chromadb_results JSONB,  -- {matches: [], scores: [], ...}
    elasticsearch_results JSONB,  -- {matches: [], scores: [], ...}
    llm_analysis JSONB,  -- {fit_score: int, breakdown: {...}, recommendations: []}
    created_at TIMESTAMP
);
```

## Authentication Flow

### Demo User System
```
Frontend loads → GET /demo/token
                      ↓
    Backend creates/retrieves demo user (demo@lifechonicle.app)
                      ↓
    Generate JWT token with 30-day expiration
                      ↓
    Return: {access_token: "eyJ...", token_type: "bearer", user: {...}}
                      ↓
    Frontend stores in localStorage
                      ↓
    Axios interceptor adds Authorization: Bearer <token> to all requests
```

### Protected Endpoints
All `/elasticsearch/*` endpoints require:
```python
@router.post("/analyze")
async def analyze_job(
    data: AnalysisRequest,
    user: User = Depends(current_active_user),  # JWT validation
    db: AsyncSession = Depends(get_async_session)
):
```

## File Parsing Architecture

### Client-Side Parsing
```typescript
.txt → FileReader.readAsText() → Plain text

.docx → FileReader.readAsArrayBuffer() → mammoth.extractRawText() → Text

.pdf → FileReader.readAsArrayBuffer() → pdfjsLib.getDocument()
       → Loop through pages → Extract text content → Concatenated text
```

### Server-Side Parsing
```python
.doc → UploadFile.read() → olefile.OleFileIO()
       → Extract 'WordDocument' stream → Decode with latin-1
       → Filter non-printable characters → Cleaned text
```

## Error Handling Strategy

### Frontend
- Try file parsing → Catch errors → Show user-friendly message
- CORS errors → Suggest copy/paste alternative
- API errors → Display detailed error from backend
- Token expiration → Auto-refresh from /demo/token

### Backend
- File parsing errors → HTTPException 400 with helpful message
- Missing profile → HTTPException 404 "Please upload CV first"
- LLM errors → Log and return fallback analysis
- Database errors → Retry logic with exponential backoff

## Performance Considerations

### Frontend
- Lazy loading of PDF.js worker
- File size limits (handled by backend)
- Debounced text input
- Cached API responses in component state

### Backend
- Connection pooling for PostgreSQL (pool_size=10, max_overflow=20)
- Async/await for all I/O operations
- ChromaDB persistent storage
- Elasticsearch connection pooling
- LLM request timeout (30 seconds)

## Security

### Frontend
- No sensitive data in localStorage (only JWT token)
- HTTPS only for production
- No API keys exposed

### Backend
- JWT token validation on all protected endpoints
- User scoping for all queries (WHERE user_id = current_user.id)
- SQL injection prevention via SQLAlchemy ORM
- CORS configured for specific origins
- Rate limiting on LLM endpoints (future enhancement)

## Deployment Architecture

### Frontend (Strato SFTP)
```
Build locally → Upload via SFTP → Static files served by Apache/Nginx
- index.html at /dabrock-info/elasticsearch/
- Assets at /dabrock-info/elasticsearch/assets/
- .htaccess for cache control and routing
```

### Backend (Railway)
```
Git push → Railway auto-deploy → Run migrations → Start uvicorn
- Procfile: alembic upgrade head && uvicorn backend.main:app
- Auto-scaling based on traffic
- PostgreSQL database on Railway
- Environment variables managed in Railway dashboard
```

## Monitoring and Logging

### Frontend
- Console.log for development
- Error boundaries for crash reporting (future)

### Backend
- Python logging module
- Log levels: DEBUG (SQL queries), INFO (requests), WARNING (errors), ERROR (crashes)
- Railway logs accessible via `railway logs`

## Future Enhancements

1. **Real-time Progress**: WebSocket for long-running LLM analyses
2. **Batch Analysis**: Upload multiple job descriptions at once
3. **Historical Tracking**: View all past analyses
4. **Export Results**: Download analysis as PDF/CSV
5. **Custom Training**: Fine-tune embeddings on user's industry
6. **A/B Testing**: Compare different LLM providers side-by-side
