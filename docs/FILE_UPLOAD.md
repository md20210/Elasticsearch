# File Upload Implementation

## Overview

The Elasticsearch Showcase supports uploading documents in four formats:
- `.txt` - Plain text
- `.doc` - Legacy Microsoft Word (binary OLE format)
- `.docx` - Modern Microsoft Word (ZIP + XML)
- `.pdf` - Portable Document Format

Files can be uploaded for:
1. **CV/Resume** - User's curriculum vitae
2. **Cover Letter** - Optional cover letter text
3. **Job Description** - Job posting to analyze

## Architecture

### Client-Side Parsing (Frontend)
- `.txt`, `.docx`, `.pdf` files are parsed in the browser
- No file upload to server for these formats (privacy + speed)
- Extracted text is sent to backend as string

### Server-Side Parsing (Backend)
- `.doc` files are uploaded to backend for parsing
- Backend uses `olefile` library to extract text
- Returns extracted text to frontend

## Implementation Details

### File Input Component

Location: `src/components/AnalyzeJob.tsx`

```typescript
// CV Upload
<input
  type="file"
  accept=".txt,.doc,.docx,.pdf"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, 'cv');
  }}
  className="..."
/>

// Cover Letter Upload
<input
  type="file"
  accept=".txt,.doc,.docx,.pdf"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, 'coverLetter');
  }}
  className="..."
/>

// Job Description Upload
<input
  type="file"
  accept=".txt,.doc,.docx,.pdf"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, 'job');
  }}
  className="..."
/>
```

### File Upload Handler

Location: `src/components/AnalyzeJob.tsx:26-90`

```typescript
const handleFileUpload = async (file: File, type: 'cv' | 'coverLetter' | 'job') => {
  try {
    setIsLoading(true);
    setError(null);

    let text = '';
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    // Plain text files
    if (fileName.endsWith('.txt') || fileType === 'text/plain') {
      text = await file.text();
    }

    // Word documents (.docx) - client-side parsing
    else if (fileName.endsWith('.docx') || fileType.includes('wordprocessingml')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    }

    // Old Word documents (.doc) - server-side parsing
    else if (fileName.endsWith('.doc') || fileType.includes('msword')) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        'https://general-backend-production-a734.up.railway.app/elasticsearch/parse-doc',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to parse .doc file');
      }

      const result = await response.json();
      text = result.text;
    }

    // PDF files - client-side parsing
    else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      text = fullText;
    }

    else {
      throw new Error('Unsupported file type');
    }

    // Set extracted text in appropriate field
    if (type === 'cv') {
      setCvText(text);
    } else if (type === 'coverLetter') {
      setCoverLetterText(text);
    } else {
      setJobDescription(text);
    }

  } catch (err: any) {
    setError(`Failed to parse ${file.name}. Please try copying and pasting the text instead.`);
    console.error('File upload error:', err);
  } finally {
    setIsLoading(false);
  }
};
```

## Format-Specific Implementation

### Plain Text (.txt)

**Method**: HTML5 File API

**Code**:
```typescript
text = await file.text();
```

**Pros**:
- Simplest implementation
- No dependencies
- Fast

**Cons**:
- Only works for plain text files

### Microsoft Word (.docx)

**Library**: `mammoth.js`

**Installation**:
```bash
npm install mammoth
```

**Import**:
```typescript
import mammoth from 'mammoth';
```

**Code**:
```typescript
const arrayBuffer = await file.arrayBuffer();
const result = await mammoth.extractRawText({ arrayBuffer });
text = result.value;
```

**How it works**:
1. Read file as ArrayBuffer
2. Mammoth unzips .docx (it's actually a ZIP file)
3. Parses XML documents inside
4. Extracts text content from `word/document.xml`
5. Returns plain text without formatting

**Pros**:
- Client-side parsing (no server upload)
- Fast and lightweight
- Handles complex documents

**Cons**:
- Only extracts text (no formatting, images, etc.)
- Some advanced Word features not supported

### Legacy Word (.doc)

**Backend Library**: `olefile` (Python)

**Why server-side?**:
- .doc is binary OLE format (not XML like .docx)
- No good JavaScript libraries for parsing
- Python's `olefile` is reliable

**Installation** (backend):
```bash
pip install olefile==0.47
```

**Frontend Code**:
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
text = result.text;
```

**Backend Code** (`backend/api/elasticsearch_showcase.py:423-469`):
```python
@router.post("/parse-doc")
async def parse_doc_file(file: UploadFile = File(...)):
    """Parse .doc file and extract text using olefile."""
    try:
        import olefile
        import io
        import string

        # Read uploaded file
        file_content = await file.read()

        # Parse OLE structure
        ole = olefile.OleFileIO(io.BytesIO(file_content))

        # Check if WordDocument stream exists
        if ole.exists('WordDocument'):
            word_stream = ole.openstream('WordDocument')
            data = word_stream.read()

            # Decode binary data (Latin-1 encoding)
            text = data.decode('latin-1', errors='ignore')

            # Clean up non-printable characters
            printable = set(string.printable)
            text = ''.join(filter(lambda x: x in printable, text))

            ole.close()

            # Validate extraction
            if text and len(text) > 10:
                return {"text": text, "success": True}
            else:
                raise ValueError("Could not extract meaningful text")
        else:
            raise ValueError(".doc file structure not recognized")

    except Exception as e:
        logger.error(f"Error parsing .doc file: {e}")
        raise HTTPException(
            status_code=400,
            detail=f".doc file parsing failed: {str(e)}. Please save as .docx or copy/paste instead."
        )
```

**How it works**:
1. Frontend uploads file as multipart/form-data
2. Backend reads file into BytesIO buffer
3. olefile parses OLE structure (like a mini filesystem)
4. Extract 'WordDocument' stream (contains text)
5. Decode from Latin-1 encoding
6. Filter non-printable characters
7. Return cleaned text

**Pros**:
- Supports legacy Word documents
- Reliable extraction

**Cons**:
- Requires server upload (slower, privacy concern)
- Text quality varies by document complexity
- May contain formatting artifacts

### PDF (.pdf)

**Library**: `pdfjs-dist` (Mozilla's PDF.js)

**Installation**:
```bash
npm install pdfjs-dist@4.10.38
```

**Import**:
```typescript
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source (required for parsing)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
```

**Code**:
```typescript
const arrayBuffer = await file.arrayBuffer();
const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
const pdf = await loadingTask.promise;

let fullText = '';
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const textContent = await page.getTextContent();
  const pageText = textContent.items
    .map((item: any) => item.str)
    .join(' ');
  fullText += pageText + '\n';
}
text = fullText;
```

**How it works**:
1. Read file as ArrayBuffer
2. PDF.js parses PDF structure
3. Loop through each page (1-indexed)
4. Extract text content from each page
5. Concatenate all pages with newlines

**Pros**:
- Client-side parsing (no upload needed)
- Handles complex PDFs
- Industry-standard library (used by Firefox)

**Cons**:
- Large library size (~2.5 MB)
- Requires Web Worker setup
- Some PDFs with images or scanned text won't work (needs OCR)

## File Size Limits

### Frontend
No explicit file size limit, but:
- Large files (>10 MB) may cause browser slowdown
- PDF parsing is memory-intensive

### Backend
FastAPI default: 10 MB per file

To increase (in `backend/main.py`):
```python
app = FastAPI(
    # Increase to 50 MB
    max_request_size=50 * 1024 * 1024
)
```

## Error Handling

### User-Friendly Messages

```typescript
try {
  // File parsing...
} catch (err: any) {
  setError(`Failed to parse ${file.name}. Please try copying and pasting the text instead.`);
  console.error('File upload error:', err);
}
```

### Specific Error Cases

**Unsupported file type**:
```typescript
else {
  throw new Error('Unsupported file type');
}
```

**.doc parsing fails** (backend):
```python
raise HTTPException(
    status_code=400,
    detail=f".doc file parsing failed: {str(e)}. Please save as .docx or copy/paste the text instead."
)
```

**PDF with no text**:
- User uploads scanned PDF
- PDF.js extracts empty string
- Form shows empty textarea
- User must manually type or use OCR tool

## Testing Checklist

Test each file type for each upload field:

### CV Upload
- [ ] .txt file with CV text
- [ ] .docx file with formatted CV
- [ ] .doc file (legacy Word)
- [ ] .pdf file with text-based CV
- [ ] Scanned PDF (should show error or empty)
- [ ] Large file (>5 MB)

### Cover Letter Upload
- [ ] .txt file
- [ ] .docx file
- [ ] .doc file
- [ ] .pdf file

### Job Description Upload
- [ ] .txt file
- [ ] .docx file (job posting)
- [ ] .doc file
- [ ] .pdf file (company job posting)

### Error Cases
- [ ] Corrupted file
- [ ] Renamed file (e.g., .txt renamed to .docx)
- [ ] Empty file
- [ ] File with special characters in name
- [ ] Very large file (>50 MB)

## Future Enhancements

1. **OCR Support**: Use Tesseract.js for scanned PDFs
2. **Drag & Drop**: Drag files directly onto textarea
3. **File Preview**: Show first 500 characters before upload
4. **Progress Indicator**: Show parsing progress for large PDFs
5. **Batch Upload**: Upload multiple files at once
6. **Format Validation**: Check file content, not just extension
7. **Client-Side .doc Parsing**: Investigate JavaScript OLE parsers
8. **RTF Support**: Add Rich Text Format (.rtf) parsing
9. **Google Docs Integration**: Direct import from Google Drive
10. **LinkedIn Import**: Auto-fetch CV from LinkedIn profile
