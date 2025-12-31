# Changelog

## Project: Elasticsearch Showcase
All notable changes to this project are documented here.

---

## [1.0.0] - 2025-12-30

### Initial Feature Request
**User Request**: ".doc und .pdf sollten auch uploaded werden koennen"
- Add support for .doc and .pdf file uploads
- Extend existing .txt and .docx support

### Added

#### File Upload Support
- **PDF Parsing**: Client-side PDF parsing using PDF.js (pdfjs-dist v4.10.38)
  - Page-by-page text extraction
  - Handles multi-page documents
  - Works in browser without backend upload

- **Legacy .doc Parsing**: Backend endpoint for old Microsoft Word files
  - New endpoint: `POST /elasticsearch/parse-doc`
  - Uses Python `olefile` library
  - Extracts text from binary OLE format
  - Returns cleaned text to frontend

- **Cover Letter Upload**: File upload support for cover letters
  - Same formats as CV: .txt, .doc, .docx, .pdf
  - Optional field alongside CV upload

- **URL Loading**: Restored all URL input fields
  - CV URL with "Load" button
  - Job URL with "Load" button
  - Homepage URL input
  - LinkedIn URL input
  - CORS error handling with helpful messages

#### Authentication System
- **Demo User Auto-Login**: Removed login requirement
  - Frontend automatically fetches JWT token on app load
  - `/demo/token` endpoint provides instant access
  - Token stored in localStorage
  - Axios interceptor adds token to all requests

- **Data Persistence**: CV and analysis data saved to database
  - Profile creation before job analysis
  - User-scoped data storage
  - PostgreSQL with pgvector extension

#### Backend Improvements
- **Model Registration Fix**: Critical bug fix in database.py
  - Added imports for UserElasticProfile and ElasticJobAnalysis
  - Fixed 500 error on job analysis endpoint
  - Tables now created automatically on startup

- **Dependencies**: Added olefile==0.47 for .doc parsing

### Changed

#### Tailwind CSS Downgrade
- **Problem**: Tailwind v4 doesn't generate utility classes
  - Page loaded white without styling
  - v4 uses CSS variables, not utility classes

- **Solution**: Downgraded to Tailwind v3.4.0
  - Updated src/index.css directives
  - Created tailwind.config.js
  - Created postcss.config.js
  - Rebuilt application
  - Verified CSS contains utility classes

#### App Structure
- **Removed Login Page**: Made showcase public
  - Removed conditional login rendering
  - Added "Demo User - Public Access" header
  - Automatic authentication on app load

### Fixed

#### Error 1: Wrong Application Showing
- **Symptom**: Job Assistant login page instead of Elasticsearch Showcase
- **Cause**: Old authentication code still present
- **Fix**: Removed login logic, implemented auto-auth
- **Commit**: "Remove authentication UI, implement auto demo login"

#### Error 2: CSS Not Loading
- **Symptom**: Page loads white with no styling
- **Cause**: Tailwind v4 architecture incompatibility
- **Fix**: Downgrade to Tailwind v3
- **Commit**: "Fix CSS styling by downgrading to Tailwind v3"

#### Error 3: URL Fields Removed
- **Symptom**: All "Load from URL" buttons disappeared
- **Cause**: Misunderstood CORS error, removed fields
- **Fix**: Restored all URL fields with better error messages
- **Commit**: "Restore URL input fields with CORS error handling"

#### Error 4: SFTP Environment Variables
- **Symptom**: SFTP upload fails with "Could not resolve host"
- **Cause**: Environment variables don't persist across Bash commands
- **Fix**: Combine all commands with && operator
- **Files**: Deployment process documentation

#### Error 5: Database Tables Not Created
- **Symptom**: 500 error - "relation 'elastic_job_analyses' does not exist"
- **Cause**: Elasticsearch models never imported in database.py
- **Fix**: Import UserElasticProfile and ElasticJobAnalysis
- **Commit**: cd14284 "Fix: Import Elasticsearch models to register tables"

### Deployment

#### Frontend (Strato SFTP)
- Build: `npm run build` in /mnt/e/CodelocalLLM/elasticsearch
- Upload via SFTP to https://dabrock.info/elasticsearch/
- Files: index.html, assets/*.css, assets/*.js
- Deployment time: ~2 minutes

#### Backend (Railway)
- Auto-deploy from Git push
- Procfile runs migrations: `alembic upgrade head`
- PostgreSQL database on Railway
- Deployment time: ~11 minutes
- Live at: https://general-backend-production-a734.up.railway.app

### Documentation
Created comprehensive documentation in `/docs`:
- **README.md**: Project overview and quick start
- **ARCHITECTURE.md**: System architecture and data flow
- **DEPLOYMENT.md**: Frontend and backend deployment guides
- **FILE_UPLOAD.md**: File parsing implementation details
- **AUTHENTICATION.md**: Demo user authentication system
- **TROUBLESHOOTING.md**: All errors encountered with solutions
- **API.md**: Complete API endpoint documentation
- **CHANGELOG.md**: This file

### Technical Details

#### Frontend Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v3.4.0
- PDF.js (pdfjs-dist) for PDF parsing
- mammoth.js for .docx parsing
- Axios with interceptors for API calls
- Lucide React for icons

#### Backend Stack
- FastAPI (Python)
- PostgreSQL + pgvector
- ChromaDB for vector search
- Elasticsearch for keyword search
- SQLAlchemy async ORM
- FastAPI Users for authentication
- olefile for .doc parsing

#### File Parsing Summary
| Format | Location | Library | Speed |
|--------|----------|---------|-------|
| .txt | Client | Native File API | Instant |
| .docx | Client | mammoth.js | Fast |
| .pdf | Client | PDF.js | Medium |
| .doc | Server | olefile | Slow |

---

## Timeline

**2025-12-30 Morning**: Initial request for .doc and .pdf support

**2025-12-30 10:00**: Implemented PDF and .doc parsing

**2025-12-30 10:15**: First deployment - wrong app showing

**2025-12-30 10:30**: Fixed authentication, deployed again

**2025-12-30 10:45**: CSS not loading - discovered Tailwind v4 issue

**2025-12-30 11:00**: Downgraded to Tailwind v3, redeployed

**2025-12-30 11:15**: URL fields removed by mistake, user requested restore

**2025-12-30 11:30**: Restored URL fields with CORS handling

**2025-12-30 12:00**: Added cover letter upload support

**2025-12-30 12:30**: User tested - CORS error and 500 error on analyze

**2025-12-30 13:00**: Diagnosed database table registration bug

**2025-12-30 13:15**: Fixed database.py, pushed to Railway

**2025-12-30 13:30**: Railway deployment in progress (~11 minutes)

**2025-12-30 14:00**: Documentation request - created all docs

---

## Future Enhancements

### Planned Features
1. **OCR Support**: Use Tesseract.js for scanned PDFs
2. **Drag & Drop**: Drag files directly onto textareas
3. **File Preview**: Show first 500 characters before upload
4. **Progress Indicator**: Show parsing progress for large PDFs
5. **Batch Upload**: Upload multiple files at once
6. **Format Validation**: Check file content, not just extension
7. **RTF Support**: Add Rich Text Format parsing
8. **Google Docs Integration**: Direct import from Google Drive

### Backend Improvements
1. **Rate Limiting**: Implement request limits per IP
2. **Caching**: Cache LLM responses for identical queries
3. **WebSocket**: Real-time progress for long analyses
4. **Export**: Download results as PDF/CSV
5. **Historical Tracking**: View all past analyses
6. **A/B Testing**: Compare different LLM providers

### Infrastructure
1. **Monitoring**: Add error tracking (Sentry)
2. **Analytics**: Track usage patterns
3. **CDN**: Use CDN for faster frontend loading
4. **Database Backups**: Automated daily backups
5. **Staging Environment**: Separate environment for testing

---

## Breaking Changes

None - this is the initial release.

---

## Known Issues

1. **Scanned PDFs**: PDF.js can't extract text from scanned documents (images)
   - Workaround: Manual typing or OCR tool
   - Future fix: Integrate Tesseract.js

2. **Legacy .doc Quality**: Text extraction from .doc varies by document
   - Some formatting artifacts may appear
   - Workaround: Save as .docx for better quality

3. **CORS Restrictions**: Loading from URLs may fail due to CORS
   - Server doesn't allow cross-origin requests
   - Workaround: Copy/paste instead of URL loading

4. **Large Files**: PDF parsing may slow down browser for files >10 MB
   - Workaround: Use backend upload (future feature)

---

## Contributors

- **Michael Dabrock** - Initial development
- **Claude Code** - AI pair programming assistant

---

## License

Private project - No license specified

---

## Contact

- Website: https://dabrock.info
- LinkedIn: https://linkedin.com/in/mdabrock
- Email: Contact via website

---

## Acknowledgments

- **PDF.js**: Mozilla's PDF parsing library
- **mammoth.js**: Microsoft .docx parser
- **olefile**: Python OLE file parser
- **FastAPI**: Modern Python web framework
- **Railway**: Easy deployment platform
- **Tailwind CSS**: Utility-first CSS framework
