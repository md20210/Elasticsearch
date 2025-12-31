# Elasticsearch Showcase Documentation

## Project Overview

The Elasticsearch Showcase is a public web application that demonstrates the comparison between ChromaDB (vector database) and Elasticsearch (search engine) for CV/job matching. It allows users to:

- Upload their CV in multiple formats (.txt, .doc, .docx, .pdf)
- Upload or paste job descriptions
- Analyze job fit using AI (Grok/Anthropic/Ollama)
- Compare results between ChromaDB vector similarity and Elasticsearch keyword search
- View detailed analysis including skills matching, experience requirements, and fit scores

## Key Features

### Multi-Format File Upload
- **CV Upload**: Supports .txt, .doc, .docx, and .pdf formats
- **Cover Letter Upload**: Same format support as CV
- **Job Description Upload**: Same format support
- **URL Loading**: Load from CV URL, Job URL, Homepage URL, LinkedIn URL (may encounter CORS restrictions)

### AI-Powered Analysis
- **Provider Options**: Grok, Anthropic Claude, Ollama
- **CV Parsing**: Extracts skills, experience, education from uploaded CVs
- **Job Analysis**: Compares CV against job requirements
- **Fit Scoring**: Detailed breakdown by category (experience, skills, education, location, salary, culture, role type)

### Database Comparison
- **ChromaDB**: Vector-based semantic search using embeddings
- **Elasticsearch**: Traditional keyword-based search with BM25 scoring
- **Side-by-Side Results**: Compare precision, recall, and relevance

### Public Access
- **No Login Required**: Uses automatic demo user authentication
- **Data Persistence**: CV and analysis results saved to PostgreSQL database
- **Demo Token System**: Auto-fetches JWT token on app load

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v3
- **File Parsing**:
  - mammoth.js for .docx files
  - pdfjs-dist for PDF files
  - Backend endpoint for .doc files
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Hosting**: Strato SFTP hosting at https://dabrock.info/elasticsearch/

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL + pgvector extension
- **Search Engines**:
  - ChromaDB (vector database)
  - Elasticsearch (keyword search)
- **Authentication**: FastAPI Users with JWT
- **AI Integration**: LLM Gateway supporting Grok/Anthropic/Ollama
- **File Parsing**: olefile for legacy .doc format
- **Hosting**: Railway.app (automatic deployment from Git)

## Quick Start

### Frontend Development
```bash
cd /mnt/e/CodelocalLLM/elasticsearch
npm install
npm run dev
```

### Frontend Production Build
```bash
npm run build
# Build output in dist/ directory
```

### Backend Development
```bash
cd /mnt/e/CodelocalLLM/GeneralBackend
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### Environment Variables
Backend requires:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `GROK_API_KEY`: Grok AI API key (optional)
- `ANTHROPIC_API_KEY`: Claude API key (optional)
- ChromaDB and Elasticsearch connection details

## Documentation Index

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture and data flow
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [FILE_UPLOAD.md](./FILE_UPLOAD.md) - File upload implementation details
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Demo user authentication system
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common errors and fixes
- [API.md](./API.md) - Backend API endpoints

## Live Demo

Frontend: https://dabrock.info/elasticsearch/
Backend: https://general-backend-production-a734.up.railway.app

## Author

Michael Dabrock - 2025
