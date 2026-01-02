# Deployment Documentation

## Overview

The Elasticsearch Showcase uses a dual-deployment architecture:
- **Frontend**: Strato SFTP hosting (static files)
- **Backend**: Railway.app (automatic Git deployment)

## Frontend Deployment (Strato SFTP)

### Prerequisites
- SFTP credentials for Strato hosting
- curl with SFTP support
- Local build environment (Node.js 18+)

### Environment Variables
```bash
export SFTP_USER="your-username"
export SFTP_PASS="your-password"
export SFTP_HOST="your-host.example.com"
```

**Security Note**: Never commit actual credentials to git! Store them securely.

### Build Process

#### 1. Local Build
```bash
cd /mnt/e/CodelocalLLM/elasticsearch
npm install
npm run build
```

This creates production build in `dist/` directory:
```
dist/
├── index.html
├── vite.svg
└── assets/
    ├── index-[hash].js    (React app bundle)
    └── index-[hash].css   (Tailwind CSS)
```

#### 2. Verify Build
```bash
# Check index.html references correct asset files
cat dist/index.html

# Verify CSS contains Tailwind utility classes
grep -o "bg-gradient-to-br" dist/assets/index-*.css
```

#### 3. Upload Files via SFTP

**Method 1: Manual Upload (Individual Files)**
```bash
# Upload index.html
timeout 60 curl -T /mnt/e/CodelocalLLM/elasticsearch/dist/index.html \
  --user "$SFTP_USER:$SFTP_PASS" \
  "sftp://$SFTP_HOST/./dabrock-info/elasticsearch/index.html" -k

# Upload CSS file
timeout 60 curl -T /mnt/e/CodelocalLLM/elasticsearch/dist/assets/index-[hash].css \
  --user "$SFTP_USER:$SFTP_PASS" \
  "sftp://$SFTP_HOST/./dabrock-info/elasticsearch/assets/" -k

# Upload JS file (increase timeout for large files)
timeout 180 curl -T /mnt/e/CodelocalLLM/elasticsearch/dist/assets/index-[hash].js \
  --user "$SFTP_USER:$SFTP_PASS" \
  "sftp://$SFTP_HOST/./dabrock-info/elasticsearch/assets/" -k
```

**Method 2: Automated Script**
```bash
#!/bin/bash
# deploy-strato.sh

# Load credentials from secure location (not git!)
export SFTP_USER="your-username"
export SFTP_PASS="your-password"
export SFTP_HOST="your-host.example.com"

echo "📤 Uploading index.html..."
timeout 60 curl -T dist/index.html \
  --user "$SFTP_USER:$SFTP_PASS" \
  "sftp://$SFTP_HOST/./dabrock-info/elasticsearch/index.html" -k

echo "📤 Uploading CSS..."
timeout 60 curl -T dist/assets/*.css \
  --user "$SFTP_USER:$SFTP_PASS" \
  "sftp://$SFTP_HOST/./dabrock-info/elasticsearch/assets/" -k

echo "📤 Uploading JS..."
timeout 180 curl -T dist/assets/*.js \
  --user "$SFTP_USER:$SFTP_PASS" \
  "sftp://$SFTP_HOST/./dabrock-info/elasticsearch/assets/" -k

echo "✅ Deployment complete!"
```

### Important Notes

#### Environment Variable Persistence
Environment variables don't persist across separate Bash commands. **Wrong**:
```bash
export SFTP_USER="REDACTED_USER"
# New bash command - variable is lost!
curl --user "$SFTP_USER:..."  # Will fail
```

**Correct**:
```bash
export SFTP_USER="REDACTED_USER" && \
export SFTP_PASS="REDACTED_PASS" && \
curl --user "$SFTP_USER:$SFTP_PASS" ...
```

#### Asset Hash Changes
Every build generates new hashes. Update `index.html` references:
```html
<!-- Old -->
<script src="/elasticsearch/assets/index-ABC123.js"></script>

<!-- New after rebuild -->
<script src="/elasticsearch/assets/index-XYZ789.js"></script>
```

#### File Paths
Use `./dabrock-info/` (relative) or `/dabrock-info/` (absolute):
```bash
# Both work
sftp://$SFTP_HOST/./dabrock-info/elasticsearch/index.html
sftp://$SFTP_HOST/dabrock-info/elasticsearch/index.html
```

### Verification

#### Check Files on Server
```bash
curl --user "$SFTP_USER:$SFTP_PASS" \
  "sftp://$SFTP_HOST/" -k \
  -Q "ls /dabrock-info/elasticsearch/"

curl --user "$SFTP_USER:$SFTP_PASS" \
  "sftp://$SFTP_HOST/" -k \
  -Q "ls /dabrock-info/elasticsearch/assets/"
```

#### Download and Verify
```bash
# Download index.html from server
curl --user "$SFTP_USER:$SFTP_PASS" \
  "sftp://$SFTP_HOST/dabrock-info/elasticsearch/index.html" -k \
  > /tmp/server-index.html

# Compare with local build
diff dist/index.html /tmp/server-index.html
```

#### Test in Browser
1. Open https://dabrock.info/elasticsearch/
2. Clear browser cache (Ctrl+Shift+R)
3. Check Network tab for correct asset files
4. Verify no 404 errors

### Cache Control

Create `.htaccess` in `/dabrock-info/elasticsearch/`:
```apache
# Disable caching for HTML
<FilesMatch "\\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</FilesMatch>

# Cache assets for 1 year
<FilesMatch "\\.(js|css|png|jpg|gif|svg|woff|woff2)$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>
```

Upload:
```bash
curl -T .htaccess \
  --user "$SFTP_USER:$SFTP_PASS" \
  "sftp://$SFTP_HOST/./dabrock-info/elasticsearch/.htaccess" -k
```

### Troubleshooting

#### White Page (No CSS)
1. Check Tailwind version in package.json (should be v3, not v4)
2. Verify dist/assets/*.css contains utility classes:
   ```bash
   grep "bg-gradient-to-br" dist/assets/index-*.css
   ```
3. Check browser console for CSS 404 errors

#### Wrong Application Showing
1. Verify correct directory on SFTP server
2. Check index.html path references match actual files
3. Clear browser cache

#### Files Not Uploading
1. Check environment variables are set in same command
2. Increase timeout for large files (use `timeout 180` for JS)
3. Verify SFTP credentials

## Backend Deployment (Railway)

### Prerequisites
- Railway account connected to GitHub
- PostgreSQL database on Railway
- Environment variables configured

### Setup

#### 1. Link Railway Project
```bash
cd /mnt/e/CodelocalLLM/GeneralBackend
railway link
# Select: general-backend-production-a734
```

#### 2. Configure Environment Variables
In Railway dashboard, set:
```
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your-secret-key-here
GROK_API_KEY=xai-...
ANTHROPIC_API_KEY=sk-ant-...
LOG_LEVEL=INFO
```

### Procfile

Railway uses `Procfile` for startup commands:
```
web: alembic upgrade head && uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

This:
1. Runs database migrations (`alembic upgrade head`)
2. Starts FastAPI server on Railway's assigned port

### Deployment Process

#### 1. Commit Changes
```bash
git add .
git commit -m "Your commit message"
```

#### 2. Push to GitHub
```bash
git push origin main
```

#### 3. Automatic Deployment
Railway automatically:
1. Detects new commit
2. Builds Docker container
3. Runs `alembic upgrade head` (creates tables)
4. Starts uvicorn server
5. Routes traffic to new deployment
6. Keeps old version running until new one is healthy

**Deployment Time**: ~10-13 minutes

#### 4. Monitor Deployment
```bash
# View live logs
railway logs

# Or in Railway dashboard:
# https://railway.app/project/[project-id]/deployments
```

### Database Migrations

#### Create New Migration
```bash
cd /mnt/e/CodelocalLLM/GeneralBackend

# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Or create empty migration
alembic revision -m "Description of changes"
```

#### Edit Migration
```python
# alembic/versions/[timestamp]_description.py

def upgrade() -> None:
    # Add your schema changes
    op.create_table(
        'table_name',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('field', sa.String(), nullable=True),
    )

def downgrade() -> None:
    # Reverse the changes
    op.drop_table('table_name')
```

#### Apply Migration Locally
```bash
alembic upgrade head
```

#### Apply Migration on Railway
Migrations run automatically on deployment via Procfile.

### Critical: Model Registration

**Problem**: SQLAlchemy won't create tables for models that aren't imported.

**Solution**: Import all models in `backend/database.py`:
```python
# Import all models to register them with Base.metadata
from backend.models.user import User  # noqa: F401
from backend.models.project import Project  # noqa: F401
from backend.models.jobassistant import JobApplication  # noqa: F401
from backend.models.elasticsearch_showcase import UserElasticProfile, ElasticJobAnalysis  # noqa: F401

async def create_db_and_tables():
    """Create all database tables and enable pgvector extension with retry logic."""
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)  # Creates tables for all imported models
```

### Verification

#### Check Deployment Status
```bash
# View recent logs
railway logs --lines 100

# Check if tables were created
railway run python -c "from backend.database import engine; print(engine)"
```

#### Test Endpoints
```bash
# Health check
curl https://general-backend-production-a734.up.railway.app/health

# Get demo token
curl https://general-backend-production-a734.up.railway.app/demo/token

# Test Elasticsearch endpoint
TOKEN="eyJ..."
curl -X POST "https://general-backend-production-a734.up.railway.app/elasticsearch/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "Python developer needed",
    "job_url": "https://example.com/job",
    "required_skills": [],
    "provider": "grok"
  }'
```

### Rollback

If deployment fails:
```bash
# Railway keeps previous deployments
# Go to Railway dashboard → Deployments → Click previous deployment → "Redeploy"
```

Or manually:
```bash
git revert HEAD
git push origin main
```

### Troubleshooting

#### Deployment Fails
1. Check Railway logs for errors
2. Verify Procfile syntax
3. Ensure all dependencies in requirements.txt
4. Check Python version (should be 3.11+)

#### Database Connection Errors
1. Verify DATABASE_URL in Railway environment variables
2. Check PostgreSQL service is running
3. Look for connection pool exhaustion in logs

#### Migrations Not Running
1. Verify Procfile has `alembic upgrade head`
2. Check migration file syntax
3. Ensure `down_revision` points to correct previous migration
4. Look for migration errors in Railway logs

#### 500 Errors After Deployment
1. Check if models are imported in database.py
2. Verify tables exist: `SELECT tablename FROM pg_tables WHERE schemaname='public';`
3. Check Railway logs for Python tracebacks

## Full Deployment Workflow

### Complete Frontend + Backend Update

```bash
# 1. Backend changes
cd /mnt/e/CodelocalLLM/GeneralBackend
git add .
git commit -m "Description of backend changes"
git push origin main
# Wait ~11 minutes for Railway deployment

# 2. Frontend changes
cd /mnt/e/CodelocalLLM/elasticsearch
npm run build

# 3. Deploy frontend (set your credentials first!)
export SFTP_USER="your-username" && \
export SFTP_PASS="your-password" && \
export SFTP_HOST="your-host.example.com" && \
timeout 60 curl -T dist/index.html --user "$SFTP_USER:$SFTP_PASS" "sftp://$SFTP_HOST/./dabrock-info/elasticsearch/index.html" -k && \
timeout 60 curl -T dist/assets/*.css --user "$SFTP_USER:$SFTP_PASS" "sftp://$SFTP_HOST/./dabrock-info/elasticsearch/assets/" -k && \
timeout 180 curl -T dist/assets/*.js --user "$SFTP_USER:$SFTP_PASS" "sftp://$SFTP_HOST/./dabrock-info/elasticsearch/assets/" -k

# 4. Verify
echo "Frontend: https://dabrock.info/elasticsearch/"
echo "Backend: https://general-backend-production-a734.up.railway.app/health"
```

## Production Checklist

Before deploying to production:

- [ ] Run `npm run build` successfully
- [ ] Verify CSS contains Tailwind classes (grep test)
- [ ] Test file uploads locally (.txt, .doc, .docx, .pdf)
- [ ] Backend tests pass
- [ ] Database migrations are correct
- [ ] All models imported in database.py
- [ ] Environment variables set in Railway
- [ ] CORS origins configured for production domain
- [ ] Error handling tested
- [ ] Demo token endpoint works
- [ ] Upload all frontend files via SFTP
- [ ] Verify deployment in browser (clear cache!)
- [ ] Check Railway logs for errors
- [ ] Test end-to-end: CV upload → Job analysis → Results
