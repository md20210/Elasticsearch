# Authentication Documentation

## Overview

The Elasticsearch Showcase uses an **automatic demo user authentication** system. Users don't need to log in - the frontend automatically obtains a JWT token for a demo user on page load.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│                                                          │
│  App.tsx useEffect() on mount                           │
│         │                                                 │
│         ▼                                                 │
│  initAuth() in api.ts                                    │
│         │                                                 │
│         ▼                                                 │
│  GET /demo/token                                         │
│         │                                                 │
└─────────┼────────────────────────────────────────────────┘
          │ HTTPS
          ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (FastAPI)                           │
│                                                          │
│  /demo/token endpoint                                    │
│         │                                                 │
│         ▼                                                 │
│  Check if demo user exists                              │
│         │                                                 │
│         ├──No──► Create demo user                       │
│         │         email: demo@lifechonicle.app          │
│         │         password: demo123                      │
│         │                                                 │
│         ▼                                                 │
│  Generate JWT token                                      │
│  - Expiration: 30 days                                   │
│  - Audience: ["fastapi-users:auth"]                     │
│  - Subject: user_id                                      │
│         │                                                 │
│         ▼                                                 │
│  Return token + user info                                │
└─────────┼────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│                                                          │
│  localStorage.setItem('auth_token', token)              │
│         │                                                 │
│         ▼                                                 │
│  Axios request interceptor                               │
│  - Add Authorization: Bearer <token> to all requests    │
│         │                                                 │
│         ▼                                                 │
│  All API calls now authenticated                         │
└──────────────────────────────────────────────────────────┘
```

## Frontend Implementation

### Auto-Authentication on App Load

Location: `src/App.tsx:16-26`

```typescript
import { useEffect } from 'react';
import { initAuth } from './services/api';

function App() {
  // Initialize authentication on app load
  useEffect(() => {
    const initialize = async () => {
      try {
        await initAuth();
        console.log('Authentication initialized successfully');
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
      }
    };
    initialize();
  }, []);

  // Rest of app...
}
```

**How it works**:
1. `useEffect` runs once when App component mounts
2. Calls `initAuth()` from api.ts
3. Logs success/failure to console
4. User never sees this process

### API Service Setup

Location: `src/services/api.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = 'https://general-backend-production-a734.up.railway.app';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get or refresh demo token
export const getDemoToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/demo/token`);
    const token = response.data.access_token;

    // Store token in localStorage
    localStorage.setItem('auth_token', token);
    console.log('Demo token obtained and stored');

    return token;
  } catch (error) {
    console.error('Failed to get demo token:', error);
    throw error;
  }
};

// Initialize authentication on app load
export const initAuth = async (): Promise<void> => {
  try {
    await getDemoToken();
  } catch (error) {
    console.error('Failed to initialize authentication:', error);
    // Don't throw - app should still load even if auth fails
  }
};
```

**Key Points**:
- `getDemoToken()`: Fetches token from `/demo/token` and stores in localStorage
- `initAuth()`: Wrapper that calls getDemoToken() on app load
- Request interceptor: Automatically adds `Authorization: Bearer <token>` to all API calls
- Uses vanilla axios (not the interceptor instance) for `/demo/token` to avoid circular dependency

### Authenticated API Calls

Location: `src/services/api.ts:85-140`

```typescript
export const elasticsearchApi = {
  // Create or update user profile
  createProfile: async (profileData: UserProfileRequest, provider: string = 'grok') => {
    // Uses 'api' instance with interceptor - token added automatically
    const response = await api.post(`/elasticsearch/profile?provider=${provider}`, profileData);
    return response.data;
  },

  // Analyze job and compare ChromaDB vs Elasticsearch
  analyzeJob: async (data: AnalysisRequest, provider: string = 'grok'): Promise<AnalysisResult> => {
    // First create/update profile if CV data provided
    if (data.cv_text || data.cover_letter_text || data.homepage_url || data.linkedin_url) {
      await elasticsearchApi.createProfile({
        cv_text: data.cv_text || '',
        cover_letter_text: data.cover_letter_text,
        homepage_url: data.homepage_url,
        linkedin_url: data.linkedin_url,
      }, provider);
    }

    // Then analyze job (token added by interceptor)
    const response = await api.post<AnalysisResult>('/elasticsearch/analyze', {
      job_description: data.job_description,
      job_url: data.job_url,
      required_skills: [],
      provider: provider,
    });

    return response.data;
  },
};
```

**Authentication Flow**:
1. User uploads CV and clicks "Analyze"
2. `analyzeJob()` first calls `createProfile()` to save CV
3. Axios interceptor adds `Authorization: Bearer <token>` to POST request
4. Backend validates token and associates data with demo user
5. Then `analyzeJob()` calls `/elasticsearch/analyze`
6. Again, interceptor adds token
7. Backend retrieves user's profile and analyzes job

## Backend Implementation

### Demo Token Endpoint

Location: `backend/api/demo_auth.py:13-57`

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_async_session
from backend.models.user import User
from backend.auth.user_manager import get_user_manager, UserManager

router = APIRouter(prefix="/demo", tags=["Demo Authentication"])

@router.get("/token")
async def get_demo_token(
    db: AsyncSession = Depends(get_async_session),
    user_manager: UserManager = Depends(get_user_manager)
):
    """
    Get JWT token for demo user (testing only).
    Creates demo user if not exists, returns valid JWT token.

    WARNING: This endpoint should be DISABLED in production!
    """
    demo_email = "demo@lifechonicle.app"
    demo_password = "demo123"

    # Check if demo user exists
    result = await db.execute(
        select(User).where(User.email == demo_email)
    )
    demo_user = result.scalar_one_or_none()

    # Create demo user if not exists
    if not demo_user:
        from backend.schemas.user import UserCreate
        user_create = UserCreate(
            email=demo_email,
            password=demo_password,
            is_verified=True  # Skip email verification
        )
        demo_user = await user_manager.create(user_create)
        print(f"✅ Created demo user: {demo_email}")

    # Generate JWT token using fastapi-users auth backend
    from backend.auth.jwt import auth_backend
    strategy = auth_backend.get_strategy()
    token = await strategy.write_token(demo_user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(demo_user.id),
            "email": demo_user.email
        }
    }
```

**How it works**:
1. Query database for user with email `demo@lifechonicle.app`
2. If not found, create new user with password `demo123`
3. Generate JWT token using fastapi-users' `JWTStrategy`
4. Token contains:
   - `sub` (subject): User ID
   - `aud` (audience): `["fastapi-users:auth"]`
   - `exp` (expiration): 30 days from now
5. Return token and basic user info

### JWT Configuration

Location: `backend/auth/jwt.py`

```python
from fastapi_users.authentication import JWTStrategy, AuthenticationBackend
from fastapi_users.authentication.transport import BearerTransport

SECRET = "your-secret-key-here"  # From environment variable
ALGORITHM = "HS256"
TOKEN_LIFETIME_SECONDS = 30 * 24 * 60 * 60  # 30 days

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=SECRET,
        lifetime_seconds=TOKEN_LIFETIME_SECONDS,
        algorithm=ALGORITHM
    )

bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)
```

### Protected Endpoints

Location: `backend/api/elasticsearch_showcase.py`

```python
from fastapi import APIRouter, Depends
from backend.models.user import User
from backend.auth.user_manager import current_active_user

router = APIRouter(prefix="/elasticsearch", tags=["Elasticsearch Showcase"])

@router.post("/profile")
async def create_or_update_profile(
    profile_data: UserProfileRequest,
    provider: str = "grok",
    user: User = Depends(current_active_user),  # ← JWT validation happens here
    db: AsyncSession = Depends(get_async_session)
):
    """Create or update user's Elasticsearch profile."""
    # user.id is automatically available from validated JWT token

    # Check if profile exists for this user
    result = await db.execute(
        select(UserElasticProfile).where(UserElasticProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()

    # Create or update...
```

**Authentication Flow**:
1. Frontend sends: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
2. FastAPI extracts token from header
3. `current_active_user` dependency validates:
   - Token signature is valid (using SECRET key)
   - Token hasn't expired
   - User exists in database
   - User is active (not banned)
4. If valid: Inject `User` object into endpoint function
5. If invalid: Return 401 Unauthorized

## Data Isolation

All user data is scoped to the authenticated user:

```python
# Only get THIS user's profile
result = await db.execute(
    select(UserElasticProfile).where(UserElasticProfile.user_id == user.id)
)

# Only get THIS user's job analyses
result = await db.execute(
    select(ElasticJobAnalysis)
    .where(ElasticJobAnalysis.user_id == user.id)
    .order_by(ElasticJobAnalysis.created_at.desc())
)
```

Since all requests use the demo user token, all data is associated with the same demo user.

## Security Considerations

### Why This Is Safe for Public Demo

1. **No Sensitive Data**: Demo user has no personal information
2. **Isolated Data**: Each session uses same demo user, data is overwritten
3. **No Payment Info**: No billing or payment methods
4. **Rate Limiting**: Backend can limit requests per IP (future enhancement)
5. **Public Showcase**: Intended for demonstration, not production use

### Production Modifications Needed

To use this in production:

```python
# DISABLE demo token endpoint
# Delete or comment out in backend/main.py:
# app.include_router(demo_auth.router)

# ENABLE real authentication
# Add registration endpoint:
@router.post("/auth/register")
async def register(
    email: str,
    password: str,
    user_manager: UserManager = Depends(get_user_manager)
):
    # Create user with email verification
    # Send verification email
    # ...

# ENABLE login endpoint (already exists in fastapi-users)
# Frontend should redirect to login page if no token
```

## Token Management

### Token Expiration

Token expires after 30 days. Frontend should handle expiration:

```typescript
// Add response interceptor to detect 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - get new one
      try {
        await getDemoToken();
        // Retry original request
        return api.request(error.config);
      } catch (refreshError) {
        // Refresh failed - show error
        console.error('Token refresh failed');
      }
    }
    return Promise.reject(error);
  }
);
```

### Manual Token Refresh

User can manually refresh token (future feature):

```typescript
const refreshToken = async () => {
  try {
    await getDemoToken();
    alert('Token refreshed successfully');
  } catch (error) {
    alert('Failed to refresh token');
  }
};
```

## Testing Authentication

### Manual Testing

```bash
# 1. Get demo token
curl https://general-backend-production-a734.up.railway.app/demo/token

# Response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "bearer",
#   "user": {
#     "id": "7ba82628-49d0-4a06-a724-11790fa3fc91",
#     "email": "demo@lifechonicle.app"
#   }
# }

# 2. Use token in API call
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST "https://general-backend-production-a734.up.railway.app/elasticsearch/profile?provider=grok" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cv_text": "Software Engineer with 10 years experience",
    "cover_letter_text": "",
    "homepage_url": "https://example.com",
    "linkedin_url": "https://linkedin.com/in/example"
  }'

# 3. Verify data saved
curl -X GET "https://general-backend-production-a734.up.railway.app/elasticsearch/profile" \
  -H "Authorization: Bearer $TOKEN"
```

### Automated Testing

Location: `/tmp/test_elasticsearch.py`

```python
#!/usr/bin/env python3
import requests

API_BASE = "https://general-backend-production-a734.up.railway.app"

# Step 1: Get demo token
print("🔍 Getting demo token...")
token_resp = requests.get(f"{API_BASE}/demo/token")
token = token_resp.json()["access_token"]
print(f"✅ Token obtained: {token[:50]}...")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 2: Create profile
print("\n🔍 Creating profile...")
profile_resp = requests.post(
    f"{API_BASE}/elasticsearch/profile?provider=grok",
    headers=headers,
    json={
        "cv_text": "Michael Dabrock - Senior Software Engineer",
        "cover_letter_text": "I am interested",
        "homepage_url": "https://dabrock.info",
        "linkedin_url": "https://linkedin.com/in/mdabrock"
    }
)
print(f"Profile status: {profile_resp.status_code}")

# Step 3: Analyze job
print("\n🔍 Analyzing job...")
analyze_resp = requests.post(
    f"{API_BASE}/elasticsearch/analyze",
    headers=headers,
    json={
        "job_description": "Senior Python Developer needed",
        "job_url": "https://example.com/job/123",
        "required_skills": ["Python", "FastAPI"],
        "provider": "grok"
    }
)
print(f"Analysis status: {analyze_resp.status_code}")
```

## Troubleshooting

### Token Not Being Sent

**Symptom**: 401 Unauthorized on API calls

**Check**:
1. Verify token in localStorage: `localStorage.getItem('auth_token')`
2. Check Network tab for Authorization header
3. Verify interceptor is attached to correct axios instance

**Fix**:
```typescript
// Make sure using 'api' instance, not 'axios'
const response = await api.post('/elasticsearch/analyze', data);  // ✅ Correct
const response = await axios.post('/elasticsearch/analyze', data);  // ❌ Wrong - no interceptor
```

### Token Expired

**Symptom**: 401 Unauthorized after 30 days

**Fix**: Call `getDemoToken()` again to get fresh token

### Demo User Not Created

**Symptom**: Token generation fails

**Check Railway logs**:
```bash
railway logs --filter "demo"
```

**Fix**: Verify database connection and user_manager is working

### CORS Errors

**Symptom**: "Access to XMLHttpRequest blocked by CORS policy"

**Check** `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dabrock.info",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Fix**: Add your frontend origin to `allow_origins` list
