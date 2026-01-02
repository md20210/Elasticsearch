# Sprint Plan: RAG Comparison Demo Tab

## Sprint Overview
**Goal**: Add interactive RAG Comparison Demo tab showcasing ChromaDB vs Elasticsearch quality differences
**Duration**: 1 Sprint (5-7 days)
**Language**: English only
**No Changes**: Existing upload/analyze functionality remains unchanged

---

## User Story
**As a** technical recruiter or hiring manager
**I want to** see a live side-by-side comparison of ChromaDB vs Elasticsearch in a RAG system
**So that** I can understand the quality improvements Elasticsearch brings to real-world search scenarios

---

## Sprint Backlog

### Epic 1: Frontend - New Tab Component
**Story Points**: 13

#### Task 1.1: Add New Tab to Navigation
- [ ] Create `RAGComparisonDemo.tsx` component
- [ ] Add tab to main navigation (alongside "Upload CV", "Analyze Job", "ChromaDB Results", "Elasticsearch Results")
- [ ] Add routing if needed
- [ ] English-only labels (no i18n)
- **Estimate**: 1h

#### Task 1.2: LLM Selection Dropdown
- [ ] Create dropdown component with 2 options:
  - "Grok API (xAI)"
  - "Local Ollama (Llama 3.1)" - Default
- [ ] Add state management for selected LLM
- [ ] Style with Tailwind (matching existing design)
- **Estimate**: 1h

#### Task 1.3: Load Comparison Button
- [ ] Create "Load Comparison (One Click)" button
- [ ] Implement loading state with spinner
- [ ] Add error handling with toast notifications
- [ ] Disable button during loading (10-20 sec)
- **Estimate**: 1h

#### Task 1.4: Query Results Accordion
- [ ] Create expandable card component (5 cards)
- [ ] Implement HeadlessUI Disclosure or custom accordion
- [ ] Each card shows:
  - Query text as header
  - Side-by-side layout (ChromaDB | Elasticsearch)
  - Expand/collapse functionality
- **Estimate**: 3h

#### Task 1.5: Result Cards - Answer Display
- [ ] Left side: ChromaDB answer
- [ ] Right side: Elasticsearch answer
- [ ] Highlight differences (e.g., more precise, additional context)
- [ ] Add visual indicator for "better" answer
- **Estimate**: 2h

#### Task 1.6: Result Cards - Top-3 Chunks Display
- [ ] Show retrieved chunks with metadata
- [ ] Display chunk text (truncated if long)
- [ ] Show source document name
- [ ] Show relevance scores
- **Estimate**: 2h

#### Task 1.7: Result Cards - Bar Charts (Plotly.js)
- [ ] Install `react-plotly.js` and `plotly.js`
- [ ] Create horizontal bar chart component
- [ ] Show top-3 chunk scores
- [ ] Color-code ChromaDB (purple) vs Elasticsearch (teal)
- [ ] Add hover tooltips with chunk preview
- **Estimate**: 3h

#### Task 1.8: Summary Dashboard
- [ ] Create summary section at bottom
- [ ] Average score comparison chart (Plotly.js)
- [ ] Win count: How many times Elasticsearch scored higher
- [ ] Overall accuracy metrics
- **Estimate**: 3h

#### Task 1.9: Logstash/Kibana Static Section
- [ ] Add collapsible section "Elastic Stack Integration"
- [ ] Show Logstash pipeline diagram (SVG or Mermaid)
- [ ] Code snippet: `logstash.conf` for PDF ingestion
- [ ] Kibana screenshot (or simulated Plotly chart)
- [ ] Explain data flow: PDF → Logstash → Elasticsearch → RAG
- **Estimate**: 2h

---

### Epic 2: Backend - RAG Comparison Endpoint
**Story Points**: 21

#### Task 2.1: Create New Endpoint
- [ ] Add `/elasticsearch/rag-comparison` GET endpoint
- [ ] Query parameter: `llm` (values: "grok" | "local", default: "local")
- [ ] Query parameter: `user_id` (optional, for personalized data)
- [ ] Add to `elasticsearch_showcase.py` router
- **Estimate**: 1h

#### Task 2.2: Define 5 Example Queries
- [ ] Hard-code 5 queries in backend:
  1. "What experience does Michael Dabrock have at Google?"
  2. "Which vector database does he currently use in his projects?"
  3. "Explain the GDPR advantages of local LLMs in his applications."
  4. "What role did he play at Cognizant and IBM?"
  5. "How does he integrate RAG in tools like CV Matcher?"
- [ ] Store as constant or config
- **Estimate**: 0.5h

#### Task 2.3: Implement ChromaDB RAG Pipeline
- [ ] For each query:
  - Retrieve top-3 chunks from ChromaDB (vector similarity)
  - Format prompt: `Context: {chunks}\n\nQuestion: {query}\n\nAnswer:`
  - Send to LLM (Grok or Ollama)
  - Parse answer
- [ ] Return: `{answer, chunks, scores, retrieval_time_ms}`
- **Estimate**: 3h

#### Task 2.4: Implement Elasticsearch RAG Pipeline
- [ ] For each query:
  - Hybrid search: BM25 + Vector (kNN)
  - Boosting: Match on skills/experience fields
  - Fuzzy matching for typo tolerance
  - Retrieve top-3 chunks
  - Same LLM prompt format
- [ ] Return: `{answer, chunks, scores, retrieval_time_ms}`
- **Estimate**: 4h

#### Task 2.5: LLM Integration - Ollama (Local)
- [ ] Check if Ollama service is running
- [ ] Use `llama3.1` model (or fallback to `llama3.2`)
- [ ] POST to `http://localhost:11434/api/generate`
- [ ] Handle timeouts (30s max)
- [ ] Error handling if Ollama unavailable
- **Estimate**: 2h

#### Task 2.6: LLM Integration - Grok API
- [ ] Reuse existing `LLMGateway` service
- [ ] Use Grok-3 or Grok-4 model
- [ ] POST to xAI API with auth header
- [ ] Parse JSON response
- [ ] Handle rate limits
- **Estimate**: 1h

#### Task 2.7: Parallel Query Execution
- [ ] Use `asyncio.gather()` to run all 5 queries in parallel
- [ ] For each query: ChromaDB and Elasticsearch in parallel
- [ ] Total: 10 RAG calls (5 queries × 2 databases)
- [ ] Aggregate results
- **Estimate**: 2h

#### Task 2.8: Compute Comparison Metrics
- [ ] For each query pair:
  - Score delta (Elasticsearch - ChromaDB)
  - "Winner" (higher score)
  - Precision improvement %
- [ ] Overall metrics:
  - Average ChromaDB score
  - Average Elasticsearch score
  - Win rate (% where ES scored higher)
- **Estimate**: 2h

#### Task 2.9: Response Schema
- [ ] Create Pydantic schema `RAGComparisonResponse`:
  ```python
  class ChunkResult(BaseModel):
      text: str
      source: str
      score: float

  class RAGResult(BaseModel):
      answer: str
      chunks: List[ChunkResult]
      retrieval_time_ms: float
      avg_score: float

  class QueryComparison(BaseModel):
      query: str
      chromadb: RAGResult
      elasticsearch: RAGResult
      winner: str  # "chromadb" | "elasticsearch" | "tie"
      score_delta: float

  class RAGComparisonResponse(BaseModel):
      llm_used: str  # "grok" | "local"
      queries: List[QueryComparison]
      summary: Dict[str, Any]  # avg_scores, win_rate, etc.
  ```
- **Estimate**: 1h

#### Task 2.10: Caching (Optional)
- [ ] Cache results for 1 hour (Redis or in-memory)
- [ ] Key: `rag_comparison:{user_id}:{llm}`
- [ ] Invalidate on new CV upload
- **Estimate**: 2h

#### Task 2.11: Error Handling & Logging
- [ ] Handle Ollama/Grok API failures gracefully
- [ ] Log all RAG calls (query, chunks, answer, timing)
- [ ] Return partial results if some queries fail
- [ ] Clear error messages to frontend
- **Estimate**: 1h

---

### Epic 3: Data Preparation
**Story Points**: 8

#### Task 3.1: Seed Sample Data
- [ ] Ensure test data exists in both ChromaDB and Elasticsearch:
  - CV content (Google, Cognizant, IBM experience)
  - Project descriptions (CV Matcher, RAG tools)
  - Portfolio content (GDPR-compliant LLM usage)
- [ ] Script to populate if empty
- **Estimate**: 2h

#### Task 3.2: Index Structure Optimization
- [ ] Verify Elasticsearch mappings support hybrid search
- [ ] Add `dense_vector` field for kNN
- [ ] Ensure text fields have proper analyzers (English, synonyms)
- [ ] Test fuzzy matching on key terms
- **Estimate**: 2h

#### Task 3.3: ChromaDB Collection Setup
- [ ] Verify embeddings are indexed
- [ ] Test vector similarity search
- [ ] Ensure consistent chunking strategy (same as Elasticsearch)
- **Estimate**: 1h

#### Task 3.4: Logstash Pipeline Configuration
- [ ] Create `logstash_rag_demo.conf`
- [ ] Input: File input (watch PDF folder)
- [ ] Filter: PDF text extraction (plugin: `logstash-filter-pdf`)
- [ ] Output: Elasticsearch index `rag_documents`
- [ ] Test pipeline with sample PDF
- **Estimate**: 3h

---

### Epic 4: Integration & Testing
**Story Points**: 13

#### Task 4.1: API Integration
- [ ] Connect frontend to `/elasticsearch/rag-comparison` endpoint
- [ ] Test with both LLM options
- [ ] Verify loading states
- [ ] Handle errors (show toast)
- **Estimate**: 2h

#### Task 4.2: End-to-End Testing
- [ ] Test all 5 queries with Grok API
- [ ] Test all 5 queries with Local Ollama
- [ ] Verify answers make sense
- [ ] Check chunk relevance
- **Estimate**: 3h

#### Task 4.3: UI/UX Polish
- [ ] Add animations (accordion expand/collapse)
- [ ] Responsive design (mobile/tablet)
- [ ] Loading skeleton for cards
- [ ] Highlight "better" answers with subtle visual cue
- **Estimate**: 3h

#### Task 4.4: Performance Testing
- [ ] Measure total load time (should be <20s)
- [ ] Optimize parallel execution
- [ ] Test with slow network (Loading state clear?)
- **Estimate**: 2h

#### Task 4.5: Accessibility
- [ ] Keyboard navigation for accordion
- [ ] Screen reader support (ARIA labels)
- [ ] Color contrast check
- **Estimate**: 1h

#### Task 4.6: Documentation
- [ ] Add README section for RAG Comparison Demo
- [ ] Document LLM setup (Ollama installation, Grok API key)
- [ ] Screenshot for docs
- **Estimate**: 2h

---

### Epic 5: Deployment
**Story Points**: 5

#### Task 5.1: Environment Variables
- [ ] Add `GROK_API_KEY` to Railway
- [ ] Add `OLLAMA_HOST` (if remote Ollama)
- [ ] Add feature flag `ENABLE_RAG_DEMO` (default: true)
- **Estimate**: 0.5h

#### Task 5.2: Build & Deploy Frontend
- [ ] Run `npm run build`
- [ ] Upload to Strato (`dabrock.info/elasticsearch`)
- [ ] Test production build
- **Estimate**: 1h

#### Task 5.3: Deploy Backend
- [ ] Push to GitHub (triggers Railway deploy)
- [ ] Verify new endpoint is live
- [ ] Check logs for errors
- **Estimate**: 1h

#### Task 5.4: Smoke Testing (Production)
- [ ] Test RAG Comparison tab on live site
- [ ] Test with both LLM options
- [ ] Verify all queries work
- [ ] Check Plotly charts render correctly
- **Estimate**: 1h

#### Task 5.5: Monitor & Fix Issues
- [ ] Monitor Railway logs for 24h
- [ ] Fix any production bugs
- [ ] Optimize if slow
- **Estimate**: 1.5h

---

## Technical Architecture

### Frontend Stack
```
/src/components/RAGComparisonDemo.tsx
├── LLMSelector (Dropdown)
├── LoadComparisonButton
├── QueryResultsAccordion
│   ├── QueryCard (×5)
│   │   ├── QueryHeader
│   │   ├── SideBySideComparison
│   │   │   ├── ChromaDBResult (answer, chunks, chart)
│   │   │   └── ElasticsearchResult (answer, chunks, chart)
│   │   └── ChunkScoreChart (Plotly.js)
├── SummaryDashboard (Plotly.js)
└── ElasticStackSection (Logstash, Kibana)
```

### Backend Stack
```python
# /backend/api/elasticsearch_showcase.py

@router.get("/rag-comparison")
async def rag_comparison_demo(
    llm: str = Query("local", enum=["grok", "local"]),
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session)
):
    # 1. Load 5 example queries
    queries = get_example_queries()

    # 2. For each query, run parallel RAG:
    results = []
    for query in queries:
        chromadb_result = await chromadb_rag(query, llm)
        elasticsearch_result = await elasticsearch_rag(query, llm)
        results.append(compare_results(query, chromadb_result, elasticsearch_result))

    # 3. Compute summary
    summary = compute_summary(results)

    return RAGComparisonResponse(
        llm_used=llm,
        queries=results,
        summary=summary
    )
```

### Data Flow
```
User Click "Load Comparison"
  ↓
Frontend → GET /elasticsearch/rag-comparison?llm=local
  ↓
Backend:
  1. Retrieve from ChromaDB (vector similarity)
  2. Retrieve from Elasticsearch (hybrid BM25+kNN)
  3. Generate answer with LLM (Ollama or Grok)
  4. Compare results (scores, chunks, answer quality)
  5. Return JSON
  ↓
Frontend:
  1. Render accordion cards
  2. Plot charts (Plotly.js)
  3. Show summary dashboard
```

---

## Dependencies

### NPM Packages (Frontend)
```json
{
  "react-plotly.js": "^2.6.0",
  "plotly.js": "^2.27.0"
}
```

### Python Packages (Backend)
```txt
# Already installed:
# - elasticsearch
# - chromadb
# - openai (for LLM)

# May need:
ollama-python==0.1.0  # If using Ollama client library
```

### External Services
- **Ollama**: Must be running locally or on remote server
  - Model: `llama3.1` or `llama3.2`
  - Endpoint: `http://localhost:11434/api/generate`

- **xAI Grok API**:
  - Endpoint: `https://api.x.ai/v1/chat/completions`
  - Model: `grok-3` or `grok-4`
  - Auth: Bearer token in header

---

## Definition of Done

### Functionality
- [ ] New "RAG Comparison Demo" tab is visible in navigation
- [ ] LLM dropdown works (Grok API / Local Ollama)
- [ ] "Load Comparison" button triggers backend call
- [ ] All 5 queries return results within 20 seconds
- [ ] Accordion cards expand/collapse smoothly
- [ ] Side-by-side comparison shows ChromaDB vs Elasticsearch
- [ ] Top-3 chunks display correctly with scores
- [ ] Plotly.js bar charts render for each query
- [ ] Summary dashboard shows aggregate metrics
- [ ] Logstash/Kibana section displays static content
- [ ] No errors in browser console
- [ ] No errors in backend logs

### Quality
- [ ] Code reviewed and approved
- [ ] Unit tests for RAG pipeline (backend)
- [ ] E2E test for full user flow
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility: WCAG AA compliant
- [ ] Performance: <20s total load time

### Documentation
- [ ] README updated with RAG Comparison Demo section
- [ ] API endpoint documented in OpenAPI/Swagger
- [ ] Screenshots added to docs

### Deployment
- [ ] Frontend deployed to Strato
- [ ] Backend deployed to Railway
- [ ] Environment variables configured
- [ ] Production smoke test passed

---

## Sprint Ceremonies

### Daily Standup (15 min)
- What did I complete yesterday?
- What will I work on today?
- Any blockers?

### Sprint Review (1h)
- Demo RAG Comparison tab to stakeholders
- Show side-by-side results
- Explain Elasticsearch advantages (precision, hybrid search, fuzzy matching)

### Sprint Retrospective (45 min)
- What went well?
- What could be improved?
- Action items for next sprint

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ollama not available in production | High | Add fallback to Grok API; show error message if both fail |
| Grok API rate limits | Medium | Cache results; add retry logic with exponential backoff |
| Long load times (>20s) | Medium | Optimize parallel execution; show progress bar |
| Answers are low quality | High | Improve prompt engineering; use better chunking strategy |
| Elasticsearch index empty | High | Seed with sample data in deployment script |
| Plotly.js bundle too large | Low | Use CDN instead of bundling; lazy load |

---

## Success Metrics

### User Engagement
- **Goal**: 50% of visitors click "Load Comparison" button
- **Measurement**: Google Analytics event tracking

### Technical Performance
- **Goal**: Average load time <15 seconds
- **Measurement**: Backend logging + Sentry performance monitoring

### Quality Demonstration
- **Goal**: Elasticsearch "wins" (higher scores) in 4 out of 5 queries
- **Measurement**: Logged comparison results

### Recruiter Feedback
- **Goal**: Positive feedback from 3+ Elastic recruiters/hiring managers
- **Measurement**: LinkedIn messages, interview mentions

---

## Next Steps (Post-Sprint)

### Potential Enhancements
1. **Custom Queries**: Allow users to input their own questions (not just 5 examples)
2. **More LLMs**: Add GPT-4, Claude, Gemini for comparison
3. **Explanation Mode**: Show WHY Elasticsearch scored higher (highlight matched phrases)
4. **Export Report**: PDF/JSON export of comparison results
5. **A/B Testing**: Different chunking strategies, prompt templates
6. **Multilingual**: Add German/Spanish if needed for broader audience

### Future Sprints
- **Sprint 2**: Add custom query input
- **Sprint 3**: Integrate GPT-4 comparison
- **Sprint 4**: Kibana live dashboard (not static screenshot)

---

## Appendix

### Example Logstash Pipeline
```ruby
# logstash_rag_demo.conf

input {
  file {
    path => "/data/documents/*.pdf"
    start_position => "beginning"
    sincedb_path => "/dev/null"
  }
}

filter {
  # Extract text from PDF
  pdf {
    source => "message"
    target => "document_text"
  }

  # Chunk into paragraphs
  split {
    field => "document_text"
    terminator => "\n\n"
  }

  # Add metadata
  mutate {
    add_field => {
      "source_file" => "%{path}"
      "indexed_at" => "%{@timestamp}"
    }
  }
}

output {
  elasticsearch {
    hosts => ["${ELASTICSEARCH_HOST}"]
    index => "rag_documents"
    document_id => "%{[@metadata][fingerprint]}"
  }
}
```

### Example Query Result JSON
```json
{
  "llm_used": "local",
  "queries": [
    {
      "query": "What experience does Michael Dabrock have at Google?",
      "chromadb": {
        "answer": "Michael worked at Google as a Technical Architect.",
        "chunks": [
          {
            "text": "Senior Technical Architect at Google Cloud (2018-2020)...",
            "source": "cv.pdf",
            "score": 0.78
          },
          {
            "text": "Led cloud migration projects for Fortune 500 clients...",
            "source": "cv.pdf",
            "score": 0.72
          },
          {
            "text": "Expertise in GCP, Kubernetes, and microservices...",
            "source": "cv.pdf",
            "score": 0.69
          }
        ],
        "retrieval_time_ms": 45.3,
        "avg_score": 0.73
      },
      "elasticsearch": {
        "answer": "Michael Dabrock was a Senior Technical Architect at Google Cloud from 2018-2020, where he led cloud migration projects for Fortune 500 clients and specialized in GCP, Kubernetes, and microservices architecture.",
        "chunks": [
          {
            "text": "Senior Technical Architect at Google Cloud (2018-2020)...",
            "source": "cv.pdf",
            "score": 0.95
          },
          {
            "text": "Led cloud migration projects for Fortune 500 clients...",
            "source": "cv.pdf",
            "score": 0.89
          },
          {
            "text": "Expertise in GCP, Kubernetes, and microservices...",
            "source": "cv.pdf",
            "score": 0.85
          }
        ],
        "retrieval_time_ms": 12.7,
        "avg_score": 0.90
      },
      "winner": "elasticsearch",
      "score_delta": 0.17
    }
    // ... 4 more queries
  ],
  "summary": {
    "avg_chromadb_score": 0.71,
    "avg_elasticsearch_score": 0.88,
    "elasticsearch_win_rate": 0.80,
    "total_queries": 5,
    "elasticsearch_wins": 4,
    "chromadb_wins": 0,
    "ties": 1
  }
}
```

---

## Contact & Questions
For questions about this sprint plan, contact the development team or project lead.

**Last Updated**: 2025-12-31
**Sprint Start Date**: TBD
**Sprint End Date**: TBD
