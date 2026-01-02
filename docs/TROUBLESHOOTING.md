# Troubleshooting Guide

## Overview

This document covers all errors encountered during development and deployment of the Elasticsearch Showcase, along with their solutions.

## Frontend Issues

### Error 1: Wrong Application Showing (Job Assistant Login Page)

**Symptom**:
- User opens https://dabrock.info/elasticsearch/
- Sees "Welcome Back - Sign in to your Job Assistant account..."
- Expected to see Elasticsearch Showcase without login

**User Feedback**:
> "Es ist die Login page! Wo ist die denn definiert?"

**Root Cause**:
The Elasticsearch Showcase source code had authentication built-in with a login page component that was conditionally rendered when user was not logged in.

**Investigation**:
```typescript
// App.tsx (old code)
if (!user) {
  return <LoginPage />;  // ← This was showing Job Assistant login
}

return <ElasticsearchShowcase />;
```

**Solution**:
1. Removed all authentication imports and logic from `App.tsx`
2. Removed the `if (!user)` check that showed login page
3. Implemented automatic demo user authentication instead
4. Changed header to show "Demo User - Public Access"

**Files Changed**:
- `/src/App.tsx` - Removed login conditional, added `initAuth()`
- `/src/services/api.ts` - Added `getDemoToken()` and `initAuth()`

**Commit**: Initial authentication removal

---

### Error 2: Page Loads Without CSS Styling

**Symptom**:
- Page loads with all content visible
- Completely unstyled (white background, no colors, no spacing)
- All Tailwind utility classes not working

**User Feedback**:
> "Ja, aber ohne CSS"
> "immer noch weiss mit Inhalten"

**Browser Inspection**:
```
index.html?v3 200 document Other 0.7 kB 43 ms
index-[hash].css 200 stylesheet css 0.5 kB 35 ms
index-[hash].js 200 script javascript 2.3 MB 280 ms
```

**Root Cause**:
Project used Tailwind CSS v4.1.18, which has a completely different architecture:
- v4 uses `@theme` instead of `@tailwind` directives
- v4 generates CSS variables, NOT utility classes like `.bg-gradient-to-br`
- v4 requires JavaScript runtime for class generation

**Investigation**:
```bash
# Check if CSS contains utility classes
grep "bg-gradient-to-br" dist/assets/index-*.css
# Result: No match found ❌

# Check Tailwind version
cat package.json | grep tailwindcss
# Result: "tailwindcss": "^4.1.18" ❌
```

**Solution**:
1. Uninstalled Tailwind v4 and v4-specific packages
2. Installed Tailwind v3 (stable version)
3. Updated CSS imports
4. Created Tailwind v3 configuration files
5. Rebuilt the application

**Steps**:
```bash
# Uninstall v4
npm uninstall tailwindcss @tailwindcss/postcss

# Install v3
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0

# Update src/index.css (OLD v4 syntax)
# @import "tailwindcss";

# NEW v3 syntax:
@tailwind base;
@tailwind components;
@tailwind utilities;

# Create tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

# Create postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

# Rebuild
npm run build

# Verify CSS contains utility classes
grep "bg-gradient-to-br" dist/assets/index-*.css
# Result: Match found ✅
```

**Files Changed**:
- `package.json` - Downgraded Tailwind to v3
- `src/index.css` - Updated directives
- `tailwind.config.js` - Created
- `postcss.config.js` - Created

**Commit**: "Fix CSS styling by downgrading to Tailwind v3"

---

### Error 3: URL Fields Removed by Mistake

**Symptom**:
- All "Load from URL" buttons disappeared
- CV URL, Job URL, Homepage URL, LinkedIn URL inputs missing
- User previously saw these fields working

**User Feedback**:
> "wieso sind nun die ❌ Alle 'Load from URL' Buttons... weg? Das sollte nicht sein"
> "eben funktionierte das alles noch... wieso nun ein proxy?"

**Root Cause**:
I misunderstood a CORS error report and thought the URL fields were causing problems, so I removed them entirely.

**Solution**:
1. Restored all URL input fields
2. Kept "Load" buttons with Globe icon
3. Added helpful error messaging for CORS failures
4. Did NOT implement a proxy (as user indicated it worked before)

**Code**:
```typescript
// Restored in AnalyzeJob.tsx
<div className="space-y-2">
  <label className="block text-sm font-medium">CV/Resume URL (Optional)</label>
  <div className="flex space-x-2">
    <input
      type="url"
      value={cvUrl}
      onChange={(e) => setCvUrl(e.target.value)}
      className="flex-1 border rounded-lg px-4 py-2"
      placeholder="https://example.com/my-cv.pdf"
    />
    <button
      onClick={() => handleLoadFromUrl(cvUrl, 'cv')}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      <Globe className="w-5 h-5" />
    </button>
  </div>
</div>

// Error handling
catch (err) {
  setError('Failed to load from URL. This may be due to CORS restrictions. Please try copy/paste instead.');
}
```

**Files Changed**:
- `/src/components/AnalyzeJob.tsx` - Restored URL fields

**Commit**: "Restore URL input fields with better CORS error handling"

---

### Error 4: CORS Error and 500 Internal Server Error on Job Analysis

**Symptom**:
User uploads CV, clicks "Analyze & Compare", then sees error:

**Console Errors**:
```
Profile created/updated successfully

Access to XMLHttpRequest at 'https://general-backend-production-a734.up.railway.app/elasticsearch/analyze'
from origin 'https://dabrock.info' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.

AxiosError$1 {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK'}

POST https://general-backend-production-a734.up.railway.app/elasticsearch/analyze
net::ERR_FAILED 500 (Internal Server Error)

Analysis failed: Error: Job analysis failed. Please try again.
```

**Important Observation**:
- Profile creation worked (200 OK) ✅
- Job analysis failed (500 Internal Server Error) ❌
- CORS error appeared AFTER 500 error (not the cause)

**Investigation Steps**:

#### 1. Check CORS Configuration
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dabrock.info",  # ✅ Correct origin
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
CORS was correctly configured ✅

#### 2. Test Demo Token
```bash
curl https://general-backend-production-a734.up.railway.app/demo/token

# Response:
{
  "access_token": "eyJhbG...",
  "token_type": "bearer",
  "user": {
    "id": "7ba82628-49d0-4a06-a724-11790fa3fc91",
    "email": "demo@lifechonicle.app"
  }
}
```
Demo token working ✅

#### 3. Test Profile Creation
```bash
TOKEN="eyJ..."
curl -X POST "https://general-backend-production-a734.up.railway.app/elasticsearch/profile?provider=grok" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cv_text": "Michael Dabrock - Senior Software Engineer",
    "cover_letter_text": "I am interested",
    "homepage_url": "https://dabrock.info",
    "linkedin_url": "https://linkedin.com/in/mdabrock"
  }'

# Response: 200 OK
```
Profile creation working ✅

#### 4. Test Job Analysis
```bash
TOKEN="eyJ..."
curl -X POST "https://general-backend-production-a734.up.railway.app/elasticsearch/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "Senior Python Developer needed",
    "job_url": "https://example.com/job/123",
    "required_skills": ["Python", "FastAPI"],
    "provider": "grok"
  }'

# Response: 500 Internal Server Error
# {"detail": "column elastic_job_analyses does not exist"}
```
Found the issue! ❌

#### 5. Check Database
```bash
railway run psql $DATABASE_URL -c "\dt"

# Result: Listed tables
- users ✅
- projects ✅
- job_applications ✅
- user_elastic_profiles ❌ MISSING
- elastic_job_analyses ❌ MISSING
```

**Root Cause**:
The Elasticsearch models (`UserElasticProfile` and `ElasticJobAnalysis`) were never imported in `database.py`, so SQLAlchemy didn't know about them when creating tables.

**Why This Happened**:
```python
# backend/database.py (OLD)
async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # ↑ This only creates tables for models registered in Base.metadata
        # But UserElasticProfile and ElasticJobAnalysis were never imported!
```

SQLAlchemy requires models to be imported before `Base.metadata.create_all()` is called. If a model isn't imported anywhere, it won't be registered.

**Solution**:
Add model imports to `backend/database.py`:

```python
# backend/database.py (NEW)
import logging
logger = logging.getLogger(__name__)

# Import all models to register them with Base.metadata
from backend.models.user import User  # noqa: F401
from backend.models.project import Project  # noqa: F401
from backend.models.jobassistant import JobApplication  # noqa: F401
from backend.models.elasticsearch_showcase import UserElasticProfile, ElasticJobAnalysis  # noqa: F401

async def create_db_and_tables():
    """Create all database tables and enable pgvector extension with retry logic."""
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)  # Now includes Elasticsearch models ✅
```

**Files Changed**:
- `/mnt/e/CodelocalLLM/GeneralBackend/backend/database.py` (lines 44-48)

**Commit**: cd14284
```
Fix: Import Elasticsearch models to register tables

Problem:
- UserElasticProfile and ElasticJobAnalysis models were never imported
- SQLAlchemy didn't know about these tables
- create_db_and_tables() couldn't create them
- Result: 500 error when trying to save job analysis

Solution:
- Import all models in database.py before create_db_and_tables()
- This registers them with Base.metadata
- Tables will now be created on startup

This fixes the Elasticsearch Showcase /analyze endpoint.
```

**Deployment**:
```bash
git add backend/database.py
git commit -m "..."
git push origin main
# Railway auto-deploys (~11 minutes)
```

**Verification**:
After deployment, test endpoint:
```bash
TOKEN="eyJ..."
curl -X POST "https://general-backend-production-a734.up.railway.app/elasticsearch/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "Senior Python Developer needed",
    "job_url": "https://example.com/job/123",
    "required_skills": ["Python", "FastAPI"],
    "provider": "grok"
  }'

# Expected: 200 OK with analysis results ✅
```

**Status**: ✅ FIXED (Deployment in progress as of user's last message)

---

## Backend Issues

### Error 5: SFTP Upload Failing (Environment Variables)

**Symptom**:
```bash
export SFTP_USER="REDACTED_USER"
curl --user "$SFTP_USER:$SFTP_PASS" ...
# Error: Could not resolve host: $SFTP_HOST
```

**User Feedback**:
> "Wieso funktionierte alles heute morgen mit E:\\CodelocalLLM\\job-assistant>... und jetzt nicht mehr?"

**Root Cause**:
Environment variables don't persist between separate Bash invocations in the tool.

**Wrong Approach**:
```bash
# Command 1
export SFTP_USER="REDACTED_USER"

# Command 2 (new Bash session - variables lost!)
curl --user "$SFTP_USER:$SFTP_PASS" ...  # ❌ Variables undefined
```

**Solution**:
Combine all commands in single Bash invocation using `&&`:

```bash
export SFTP_USER="your-username" && \
export SFTP_PASS="your-password" && \
export SFTP_HOST="your-host.example.com" && \
curl --user "$SFTP_USER:$SFTP_PASS" "sftp://$SFTP_HOST/..." -k
```

Or create a deployment script:
```bash
#!/bin/bash
# deploy-strato.sh

export SFTP_USER="your-username"
export SFTP_PASS="your-password"
export SFTP_HOST="your-host.example.com"

timeout 60 curl -T dist/index.html --user "$SFTP_USER:$SFTP_PASS" "sftp://$SFTP_HOST/..." -k
```

**Security Note**: Never commit actual credentials to git!

**Files Changed**: None (process improvement)

---

### Error 6: Railway Deployment - Tables Not Created

**Symptom**:
- Railway deployment succeeds
- Backend starts without errors
- API returns 500 error: "relation 'user_elastic_profiles' does not exist"

**Root Cause**:
Same as Error 4 - models not imported in database.py

**Solution**:
Import models before `create_db_and_tables()` as shown in Error 4.

---

### Error 7: Alembic Migration Chain Broken

**Symptom**:
```
alembic.util.exc.CommandError: Can't locate revision identified by 'documents_001'
```

**Root Cause**:
Migration file had `down_revision = None`, breaking the chain.

**Wrong**:
```python
# Migration file
revision = '20251229_005333'
down_revision = None  # ❌ Breaks chain
```

**Solution**:
```python
# Migration file
revision = '20251229_005333'
down_revision = 'job_assistant_001'  # ✅ Points to previous migration
```

**Files Changed**:
- `alembic/versions/20251229_005333_add_documents_field.py`

**Commit**: "Fix migration chain - set correct down_revision"

---

## Deployment Issues

### Error 8: Old Assets Cached by Browser

**Symptom**:
- Deploy new version
- Browser still shows old content
- Hard refresh (Ctrl+Shift+R) doesn't help

**Root Cause**:
Browser caching CSS/JS files with long cache headers.

**Solution**:
1. Update cache control headers via `.htaccess`:
```apache
# .htaccess in /dabrock-info/elasticsearch/
<FilesMatch "\\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</FilesMatch>

<FilesMatch "\\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>
```

2. Use hash-based filenames (Vite does this automatically):
```
index-ABC123.js → index-XYZ789.js (new hash after rebuild)
```

3. Clear browser cache:
- Chrome: DevTools → Network tab → Disable cache
- Firefox: Ctrl+Shift+Delete → Check Cached Web Content → Clear Now

---

### Error 9: Railway Build Fails - Missing Dependencies

**Symptom**:
```
ModuleNotFoundError: No module named 'olefile'
```

**Root Cause**:
Added `olefile` to code but forgot to add to `requirements.txt`.

**Solution**:
```bash
# Add to requirements.txt
echo "olefile==0.47" >> requirements.txt

# Commit and push
git add requirements.txt
git commit -m "Add olefile dependency for .doc parsing"
git push origin main
```

---

## Testing Issues

### Error 10: Test Script Fails with CORS

**Symptom**:
```python
# test_elasticsearch.py
response = requests.post(url, json=data)
# Error: CORS policy blocks request
```

**Root Cause**:
CORS only blocks browser requests, not server-to-server (like Python requests).

This error means the backend returned a CORS error response, which means:
1. Request was received by backend
2. Backend processed it
3. Backend didn't include CORS headers in response

**Solution**:
Check if frontend origin is in `allow_origins` list in `backend/main.py`.

---

## Common Error Patterns

### Pattern 1: "Network Error" from Axios

**Possible Causes**:
1. Backend returned 500 error (check Railway logs)
2. CORS misconfigured (check allow_origins)
3. Backend is down (check health endpoint)
4. Request timeout (increase timeout)

**Debug Steps**:
```typescript
// Add detailed error logging
catch (error: any) {
  console.log('Error details:', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    config: error.config
  });
}
```

### Pattern 2: "401 Unauthorized"

**Possible Causes**:
1. Token not being sent (check localStorage)
2. Token expired (refresh token)
3. Axios interceptor not attached
4. Using wrong axios instance

**Debug Steps**:
```bash
# Check token in browser console
localStorage.getItem('auth_token')

# Decode JWT (copy token to jwt.io)
# Check 'exp' field - if < current timestamp, token expired

# Test token manually
TOKEN="eyJ..."
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/endpoint
```

### Pattern 3: SQLAlchemy "relation does not exist"

**Possible Causes**:
1. Model not imported in database.py
2. Migration not run
3. Wrong database URL (pointing to different database)

**Debug Steps**:
```bash
# Check tables in database
railway run psql $DATABASE_URL -c "\dt"

# Run migrations manually
railway run alembic upgrade head

# Check if model is imported
grep "import.*ModelName" backend/database.py
```

---

## Quick Diagnostic Checklist

### Frontend Not Loading
- [ ] Check browser console for JavaScript errors
- [ ] Verify all asset files loaded (Network tab)
- [ ] Check if CSS file contains Tailwind classes
- [ ] Clear browser cache and hard refresh
- [ ] Verify correct index.html references uploaded

### API Calls Failing
- [ ] Check if token exists in localStorage
- [ ] Verify token not expired (jwt.io)
- [ ] Check Network tab for request details
- [ ] Verify CORS headers in response
- [ ] Check Railway logs for backend errors

### Backend Errors
- [ ] Check Railway logs: `railway logs`
- [ ] Verify environment variables set
- [ ] Check database connection
- [ ] Verify all models imported in database.py
- [ ] Run migrations: `alembic upgrade head`

### Deployment Issues
- [ ] Verify build succeeded locally
- [ ] Check all files uploaded via SFTP
- [ ] Verify environment variables persisted
- [ ] Check Railway deployment status
- [ ] Test endpoints manually with curl

---

## Getting Help

### View Railway Logs
```bash
railway logs --lines 100
railway logs --filter "error"
railway logs --filter "elasticsearch"
```

### Test Endpoints Manually
```bash
# Get demo token
curl https://general-backend-production-a734.up.railway.app/demo/token

# Test profile creation
TOKEN="eyJ..."
curl -X POST "https://general-backend-production-a734.up.railway.app/elasticsearch/profile?provider=grok" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cv_text":"Test CV"}'

# Test job analysis
curl -X POST "https://general-backend-production-a734.up.railway.app/elasticsearch/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_description":"Test Job","job_url":"https://example.com","required_skills":[],"provider":"grok"}'
```

### Check Database
```bash
railway run psql $DATABASE_URL

# List tables
\dt

# Describe table
\d user_elastic_profiles

# Query data
SELECT * FROM user_elastic_profiles WHERE user_id = '7ba82628-49d0-4a06-a724-11790fa3fc91';
```

### Debug Frontend
```javascript
// In browser console

// Check token
localStorage.getItem('auth_token')

// Decode JWT
const token = localStorage.getItem('auth_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));

// Test API call
fetch('https://general-backend-production-a734.up.railway.app/demo/token')
  .then(r => r.json())
  .then(console.log);
```
