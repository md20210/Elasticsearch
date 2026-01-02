# Elasticsearch Showcase - Deployment Guide

## Production Deployment to Strato Hosting

### Server Information
- **Host**: [Your SFTP host - set in environment variable]
- **Username**: [Your SFTP username - set in environment variable]
- **Protocol**: SFTP (Port 22)
- **Correct Deployment Path**: `/dabrock-info/elasticsearch/`

**Security Note**: Never commit credentials to git! Use environment variables instead:
```bash
export SFTP_HOST="your-host.example.com"
export SFTP_USER="your-username"
export SFTP_PASS="your-password"
```

### Important Notes
⚠️ **CRITICAL**: Files must be deployed to `/dabrock-info/elasticsearch/` NOT `/elasticsearch/`

The public URL structure is:
```
https://www.lifechonicle.app/elasticsearch/
```

But the server path is:
```
/dabrock-info/elasticsearch/
```

### Directory Structure on Server
```
/dabrock-info/
└── elasticsearch/
    ├── index.html
    ├── vite.svg
    └── assets/
        ├── index-{hash}.js
        └── index-{hash}.css
```

### Deployment Steps

#### 1. Build the Application
```bash
cd /mnt/e/CodelocalLLM/elasticsearch
npm run build
```

This creates the `dist/` directory with:
- `index.html`
- `vite.svg`
- `assets/index-{hash}.js`
- `assets/index-{hash}.css`

#### 2. Deploy Files via SFTP

**Option A: Using curl (recommended)**

```bash
cd /mnt/e/CodelocalLLM/elasticsearch/dist

# Upload root files
timeout 120 curl --ftp-create-dirs --upload-file index.html \
  "sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}/dabrock-info/elasticsearch/index.html"

timeout 120 curl --ftp-create-dirs --upload-file vite.svg \
  "sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}/dabrock-info/elasticsearch/vite.svg"

# Upload assets (replace {hash} with actual hash from build)
cd assets
timeout 180 curl --ftp-create-dirs --upload-file index-{hash}.js \
  "sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}/dabrock-info/elasticsearch/assets/index-{hash}.js"

timeout 120 curl --ftp-create-dirs --upload-file index-{hash}.css \
  "sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}/dabrock-info/elasticsearch/assets/index-{hash}.css"
```

**Option B: Using automated deployment script**

```bash
cd /mnt/e/CodelocalLLM/elasticsearch
./deploy.sh
```

#### 3. Verify Deployment

```bash
# List files on server
timeout 30 curl -l "sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}/dabrock-info/elasticsearch/"

# List assets
timeout 30 curl -l "sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}/dabrock-info/elasticsearch/assets/"

# Download and check index.html
timeout 30 curl "sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}/dabrock-info/elasticsearch/index.html"
```

#### 4. Clean Up Old Files

After deploying new version, remove old asset files:

```bash
# Delete old JS and CSS files (replace {old-hash} with actual hash)
timeout 30 curl -Q "RM /dabrock-info/elasticsearch/assets/index-{old-hash}.js" \
  "sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}"

timeout 30 curl -Q "RM /dabrock-info/elasticsearch/assets/index-{old-hash}.css" \
  "sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}"
```

### Troubleshooting

#### Files Not Updating in Browser
1. **Hard refresh**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Clear browser cache completely**
3. **Try incognito/private window**
4. **Verify files on server** using curl commands above

#### Wrong Deployment Path
If files were deployed to `/elasticsearch/` instead of `/dabrock-info/elasticsearch/`:

```bash
# List files in wrong location
timeout 30 curl -l "sftp://${SFTP_USER}:${SFTP_PASS}@${SFTP_HOST}/elasticsearch/"

# You need to manually move them via FTP client or re-deploy to correct path
```

#### Asset Hash Mismatch
If `index.html` references different hash than uploaded assets:
1. Check `dist/index.html` for correct hash
2. Ensure all files from same build are uploaded together
3. Never mix files from different builds

### Current Live Version
- **Last deployed**: December 31, 2025
- **Current assets**:
  - `index-BmG3YQaI.js` (3.3 MB)
  - `index-BtHk9Mhw.css` (31.5 KB)

### Access
- **Public URL**: https://www.lifechonicle.app/elasticsearch/
- **Status**: Live and operational

### Tabs Available
1. Analyze Job - Upload CV and analyze job postings
2. Results ChromaDB - ChromaDB analysis results
3. Results Elastic - Elasticsearch analysis with Logstash and Kibana visualizations
4. Comparison - Side-by-side comparison of ChromaDB vs Elasticsearch

### Backend API
- **Production**: https://general-backend-production-a734.up.railway.app
- **Authentication**: Demo token (auto-refreshed)

### Notes
- Always use `--ftp-create-dirs` flag with curl to ensure directories exist
- Timeout values: 120s for small files, 180s for large JS files
- Password must be URL-encoded: `!` becomes `%21`
- Always deploy all files from same build together to avoid hash mismatches
