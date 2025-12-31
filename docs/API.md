# API Documentation

## Base URL

Production: `https://general-backend-production-a734.up.railway.app`

## Authentication

All endpoints (except `/demo/token`) require JWT authentication.

**Header**:
```
Authorization: Bearer <jwt_token>
```

**Get Demo Token**:
```bash
curl https://general-backend-production-a734.up.railway.app/demo/token
```

## Endpoints

### Demo Authentication

#### Get Demo Token
Get JWT token for demo user without login.

**Endpoint**: `GET /demo/token`

**Authentication**: None required

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "7ba82628-49d0-4a06-a724-11790fa3fc91",
    "email": "demo@lifechonicle.app"
  }
}
```

**Example**:
```bash
curl https://general-backend-production-a734.up.railway.app/demo/token
```

**Notes**:
- Token expires after 30 days
- Always creates or retrieves demo user (demo@lifechonicle.app)
- For demonstration purposes only

---

### User Profile Management

#### Create or Update Profile
Parse CV with LLM and store in database. Creates embeddings for ChromaDB and indexes in Elasticsearch.

**Endpoint**: `POST /elasticsearch/profile`

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `provider` (optional): AI provider to use. Options: `grok`, `anthropic`, `ollama`. Default: `grok`

**Request Body**:
```json
{
  "cv_text": "Michael Dabrock - Senior Software Engineer with 10+ years experience...",
  "cover_letter_text": "I am very interested in this position...",
  "homepage_url": "https://dabrock.info",
  "linkedin_url": "https://linkedin.com/in/mdabrock"
}
```

**Fields**:
- `cv_text` (required): Full text of CV/resume
- `cover_letter_text` (optional): Cover letter text
- `homepage_url` (optional): Personal website URL
- `linkedin_url` (optional): LinkedIn profile URL

**Response**:
```json
{
  "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "user_id": "7ba82628-49d0-4a06-a724-11790fa3fc91",
  "cv_text": "Michael Dabrock - Senior Software Engineer...",
  "parsed_cv": {
    "skills": ["Python", "FastAPI", "React", "Docker", "Elasticsearch"],
    "experience_years": 10,
    "education": "Master of Science in Computer Science",
    "location": "Berlin, Germany",
    "salary_expectation": "80000-100000 EUR",
    "preferred_role_types": ["Full-time", "Remote"],
    "certifications": ["AWS Certified", "Python Professional"]
  },
  "cover_letter_text": "I am very interested...",
  "homepage_url": "https://dabrock.info",
  "linkedin_url": "https://linkedin.com/in/mdabrock",
  "chromadb_id": "demo_user_cv",
  "elasticsearch_doc_id": "7ba82628-49d0-4a06-a724-11790fa3fc91",
  "created_at": "2025-12-30T10:30:00Z",
  "updated_at": "2025-12-30T10:30:00Z"
}
```

**Example**:
```bash
TOKEN="eyJ..."

curl -X POST "https://general-backend-production-a734.up.railway.app/elasticsearch/profile?provider=grok" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cv_text": "Michael Dabrock - Senior Software Engineer with 10+ years experience in Python, FastAPI, React, Docker, and Elasticsearch",
    "cover_letter_text": "I am very interested in this position and believe my skills align well",
    "homepage_url": "https://dabrock.info",
    "linkedin_url": "https://linkedin.com/in/mdabrock"
  }'
```

**Notes**:
- LLM extracts structured data from CV text
- Creates embeddings using Sentence Transformers (all-MiniLM-L6-v2)
- Stores in ChromaDB for vector search
- Indexes in Elasticsearch for keyword search
- Overwrites existing profile if one exists

**Errors**:
- `400`: Invalid request body or LLM parsing failed
- `401`: Unauthorized (invalid/missing token)
- `500`: Database or LLM service error

---

#### Get User Profile
Retrieve current user's CV profile.

**Endpoint**: `GET /elasticsearch/profile`

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "user_id": "7ba82628-49d0-4a06-a724-11790fa3fc91",
  "cv_text": "Michael Dabrock - Senior Software Engineer...",
  "parsed_cv": {
    "skills": ["Python", "FastAPI", "React"],
    "experience_years": 10,
    "education": "Master of Science in Computer Science",
    "location": "Berlin, Germany"
  },
  "cover_letter_text": "I am interested...",
  "homepage_url": "https://dabrock.info",
  "linkedin_url": "https://linkedin.com/in/mdabrock",
  "chromadb_id": "demo_user_cv",
  "elasticsearch_doc_id": "7ba82628-49d0-4a06-a724-11790fa3fc91",
  "created_at": "2025-12-30T10:30:00Z",
  "updated_at": "2025-12-30T10:30:00Z"
}
```

**Example**:
```bash
TOKEN="eyJ..."

curl -X GET "https://general-backend-production-a734.up.railway.app/elasticsearch/profile" \
  -H "Authorization: Bearer $TOKEN"
```

**Errors**:
- `401`: Unauthorized (invalid/missing token)
- `404`: Profile not found (user hasn't uploaded CV yet)

---

### Job Analysis

#### Analyze Job vs CV
Compare job description against user's CV using both ChromaDB (vector search) and Elasticsearch (keyword search).

**Endpoint**: `POST /elasticsearch/analyze`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "job_description": "We are looking for a Senior Python Developer with FastAPI experience...",
  "job_url": "https://example.com/jobs/senior-python-developer",
  "required_skills": ["Python", "FastAPI", "Docker"],
  "provider": "grok"
}
```

**Fields**:
- `job_description` (required): Full text of job posting
- `job_url` (optional): URL to job posting
- `required_skills` (optional): List of required skills (can be empty)
- `provider` (optional): AI provider. Options: `grok`, `anthropic`, `ollama`. Default: `grok`

**Response**:
```json
{
  "id": "x9y8z7w6-v5u4-3t2s-1r0q-9p8o7n6m5l4k",
  "user_id": "7ba82628-49d0-4a06-a724-11790fa3fc91",
  "job_description": "We are looking for a Senior Python Developer...",
  "job_url": "https://example.com/jobs/senior-python-developer",

  "chromadb_results": {
    "matches": [
      {
        "id": "demo_user_cv",
        "distance": 0.23,
        "similarity": 0.77,
        "metadata": {
          "skills": ["Python", "FastAPI", "React", "Docker"],
          "experience_years": 10,
          "education": "Master of Science",
          "location": "Berlin"
        }
      }
    ],
    "query_time_ms": 45,
    "match_count": 1
  },

  "elasticsearch_results": {
    "matches": [
      {
        "id": "7ba82628-49d0-4a06-a724-11790fa3fc91",
        "score": 8.45,
        "metadata": {
          "skills": ["Python", "FastAPI", "React", "Docker"],
          "experience_years": 10,
          "education": "Master of Science",
          "location": "Berlin"
        }
      }
    ],
    "query_time_ms": 12,
    "match_count": 1
  },

  "llm_analysis": {
    "overall_fit_score": 85,
    "fit_breakdown": {
      "experience": {
        "score": 90,
        "detail": {
          "candidate_value": "10+ years",
          "required_value": "5+ years",
          "comparison": "Exceeds requirement by 5 years"
        }
      },
      "skills": {
        "score": 85,
        "detail": {
          "candidate_value": "Python, FastAPI, React, Docker, Elasticsearch",
          "required_value": "Python, FastAPI, Docker",
          "comparison": "3/3 required skills matched, plus 2 bonus skills"
        }
      },
      "education": {
        "score": 100,
        "detail": {
          "candidate_value": "Master of Science in Computer Science",
          "required_value": "Bachelor's degree",
          "comparison": "Exceeds requirement (Master vs Bachelor)"
        }
      },
      "location": {
        "score": 80,
        "detail": {
          "candidate_value": "Berlin, Germany",
          "required_value": "Remote or Berlin",
          "comparison": "Perfect match for Berlin office"
        }
      },
      "salary": {
        "score": 90,
        "detail": {
          "candidate_value": "80000-100000 EUR",
          "required_value": "70000-95000 EUR",
          "comparison": "Slight overlap, negotiable"
        }
      },
      "culture": {
        "score": 75,
        "detail": {
          "candidate_value": "Prefers agile, collaborative teams",
          "required_value": "Fast-paced startup environment",
          "comparison": "Good alignment with startup culture"
        }
      },
      "role_type": {
        "score": 100,
        "detail": {
          "candidate_value": "Full-time, Remote",
          "required_value": "Full-time",
          "comparison": "Perfect match"
        }
      }
    },
    "matched_skills": ["Python", "FastAPI", "Docker"],
    "missing_skills": [],
    "recommendations": [
      "Strong candidate with relevant experience",
      "All required skills present",
      "Consider emphasizing Docker experience in interview"
    ]
  },

  "created_at": "2025-12-30T11:00:00Z"
}
```

**Example**:
```bash
TOKEN="eyJ..."

curl -X POST "https://general-backend-production-a734.up.railway.app/elasticsearch/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "We are looking for a Senior Python Developer with FastAPI experience, Docker knowledge, and 5+ years of experience",
    "job_url": "https://example.com/jobs/123",
    "required_skills": ["Python", "FastAPI", "Docker"],
    "provider": "grok"
  }'
```

**Notes**:
- Requires user to have profile created first (call `/elasticsearch/profile` first)
- Performs vector search via ChromaDB (semantic similarity)
- Performs keyword search via Elasticsearch (BM25 scoring)
- LLM analyzes results and generates fit score + recommendations
- Results saved to database for future reference

**Errors**:
- `401`: Unauthorized (invalid/missing token)
- `404`: User profile not found (upload CV first)
- `400`: Invalid request body or LLM analysis failed
- `500`: Database, ChromaDB, Elasticsearch, or LLM service error

---

### File Parsing

#### Parse Legacy .doc File
Extract text from legacy Microsoft Word .doc files (binary OLE format).

**Endpoint**: `POST /elasticsearch/parse-doc`

**Authentication**: None required (public endpoint)

**Request**: Multipart form data

**Form Fields**:
- `file`: Binary file data (.doc file)

**Response**:
```json
{
  "text": "Extracted text from .doc file...",
  "success": true
}
```

**Example**:
```bash
curl -X POST "https://general-backend-production-a734.up.railway.app/elasticsearch/parse-doc" \
  -F "file=@/path/to/resume.doc"
```

**Example (JavaScript)**:
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(
  'https://general-backend-production-a734.up.railway.app/elasticsearch/parse-doc',
  {
    method: 'POST',
    body: formData,
  }
);

const result = await response.json();
console.log(result.text);
```

**Notes**:
- Uses Python `olefile` library to parse binary OLE structure
- Extracts text from 'WordDocument' stream
- Filters non-printable characters
- Text quality varies by document complexity
- For .docx files, use client-side parsing instead (mammoth.js)

**Errors**:
- `400`: File parsing failed or unsupported format
  - Error message includes suggestion to use .docx or copy/paste
- `413`: File too large (>10 MB)

---

### Health Check

#### Backend Health
Check if backend service is running.

**Endpoint**: `GET /health`

**Authentication**: None required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-30T12:00:00Z"
}
```

**Example**:
```bash
curl https://general-backend-production-a734.up.railway.app/health
```

---

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found (resource doesn't exist)
- `413`: Payload Too Large (file too big)
- `500`: Internal Server Error (backend issue)

### Common Error Messages

**401 Unauthorized**:
```json
{
  "detail": "Not authenticated"
}
```

**404 Profile Not Found**:
```json
{
  "detail": "Please upload your CV first before analyzing jobs."
}
```

**400 Invalid Input**:
```json
{
  "detail": "cv_text is required"
}
```

**400 File Parsing Failed**:
```json
{
  "detail": ".doc file parsing failed: Could not extract text. Please save as .docx or copy/paste the text instead."
}
```

**500 LLM Error**:
```json
{
  "detail": "LLM analysis failed: Connection timeout"
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Future enhancement planned.

**Recommended Limits** (for production):
- `/demo/token`: 10 requests per minute per IP
- `/elasticsearch/profile`: 30 requests per minute per user
- `/elasticsearch/analyze`: 20 requests per minute per user
- `/elasticsearch/parse-doc`: 10 requests per minute per IP

---

## Data Models

### UserProfileRequest
```typescript
{
  cv_text: string;                 // Required
  cover_letter_text?: string;      // Optional
  homepage_url?: string;           // Optional
  linkedin_url?: string;           // Optional
}
```

### AnalysisRequest
```typescript
{
  job_description: string;         // Required
  job_url?: string;                // Optional
  required_skills: string[];       // Optional (can be empty array)
  provider?: string;               // Optional: "grok" | "anthropic" | "ollama"
}
```

### ParsedCV
```typescript
{
  skills: string[];
  experience_years: number;
  education: string;
  location: string;
  salary_expectation?: string;
  preferred_role_types: string[];
  certifications: string[];
}
```

### FitScoreDetail
```typescript
{
  candidate_value: string;
  required_value: string;
  comparison: string;
}
```

### FitScoreBreakdown
```typescript
{
  experience: {
    score: number;              // 0-100
    detail: FitScoreDetail;
  };
  skills: {
    score: number;
    detail: FitScoreDetail;
  };
  education: {
    score: number;
    detail: FitScoreDetail;
  };
  location: {
    score: number;
    detail: FitScoreDetail;
  };
  salary: {
    score: number;
    detail: FitScoreDetail;
  };
  culture: {
    score: number;
    detail: FitScoreDetail;
  };
  role_type: {
    score: number;
    detail: FitScoreDetail;
  };
}
```

### LLMAnalysis
```typescript
{
  overall_fit_score: number;           // 0-100
  fit_breakdown: FitScoreBreakdown;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
}
```

---

## Testing

### Integration Test Script

```python
#!/usr/bin/env python3
import requests
import json

API_BASE = "https://general-backend-production-a734.up.railway.app"

# Step 1: Get demo token
print("🔍 Step 1: Getting demo token...")
token_resp = requests.get(f"{API_BASE}/demo/token")
token_data = token_resp.json()
token = token_data["access_token"]
print(f"✅ Token obtained: {token[:50]}...")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 2: Create profile
print("\n🔍 Step 2: Creating profile with CV...")
profile_data = {
    "cv_text": "Michael Dabrock - Senior Software Engineer with 10+ years experience in Python, FastAPI, React, Docker, Elasticsearch",
    "cover_letter_text": "I am very interested in this position",
    "homepage_url": "https://dabrock.info",
    "linkedin_url": "https://linkedin.com/in/mdabrock"
}

profile_resp = requests.post(
    f"{API_BASE}/elasticsearch/profile?provider=grok",
    headers=headers,
    json=profile_data
)
print(f"Profile creation status: {profile_resp.status_code}")
if profile_resp.status_code == 200:
    print("✅ Profile created successfully!")
else:
    print(f"❌ Error: {profile_resp.text}")

# Step 3: Analyze job
print("\n🔍 Step 3: Testing job analysis...")
analyze_data = {
    "job_description": "We are looking for a Senior Python Developer with FastAPI experience",
    "job_url": "https://example.com/job/123",
    "required_skills": ["Python", "FastAPI"],
    "provider": "grok"
}

analyze_resp = requests.post(
    f"{API_BASE}/elasticsearch/analyze",
    headers=headers,
    json=analyze_data
)
print(f"Analysis status: {analyze_resp.status_code}")
if analyze_resp.status_code == 200:
    print("✅ Analysis completed!")
    result = analyze_resp.json()
    print(f"Overall fit score: {result['llm_analysis']['overall_fit_score']}")
    print(f"ChromaDB matches: {result['chromadb_results']['match_count']}")
    print(f"Elasticsearch matches: {result['elasticsearch_results']['match_count']}")
else:
    print(f"❌ Error: {analyze_resp.text[:500]}")
```

---

## SDK Examples

### Python
```python
import requests

class ElasticsearchShowcaseAPI:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None

    def get_demo_token(self):
        response = requests.get(f"{self.base_url}/demo/token")
        data = response.json()
        self.token = data["access_token"]
        return self.token

    def create_profile(self, cv_text, provider="grok"):
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        data = {"cv_text": cv_text}
        response = requests.post(
            f"{self.base_url}/elasticsearch/profile?provider={provider}",
            headers=headers,
            json=data
        )
        return response.json()

    def analyze_job(self, job_description, provider="grok"):
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        data = {
            "job_description": job_description,
            "required_skills": [],
            "provider": provider
        }
        response = requests.post(
            f"{self.base_url}/elasticsearch/analyze",
            headers=headers,
            json=data
        )
        return response.json()

# Usage
api = ElasticsearchShowcaseAPI("https://general-backend-production-a734.up.railway.app")
api.get_demo_token()
api.create_profile("My CV text here...")
result = api.analyze_job("Job description here...")
print(f"Fit score: {result['llm_analysis']['overall_fit_score']}")
```

### TypeScript/JavaScript
```typescript
import axios from 'axios';

const API_BASE = 'https://general-backend-production-a734.up.railway.app';

class ElasticsearchShowcaseAPI {
  private token: string | null = null;
  private api = axios.create({ baseURL: API_BASE });

  constructor() {
    // Add interceptor to include token
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  async getDemoToken(): Promise<string> {
    const response = await axios.get(`${API_BASE}/demo/token`);
    this.token = response.data.access_token;
    return this.token;
  }

  async createProfile(cvText: string, provider = 'grok') {
    const response = await this.api.post(`/elasticsearch/profile?provider=${provider}`, {
      cv_text: cvText,
    });
    return response.data;
  }

  async analyzeJob(jobDescription: string, provider = 'grok') {
    const response = await this.api.post('/elasticsearch/analyze', {
      job_description: jobDescription,
      required_skills: [],
      provider,
    });
    return response.data;
  }
}

// Usage
const api = new ElasticsearchShowcaseAPI();
await api.getDemoToken();
await api.createProfile('My CV text here...');
const result = await api.analyzeJob('Job description here...');
console.log(`Fit score: ${result.llm_analysis.overall_fit_score}`);
```
