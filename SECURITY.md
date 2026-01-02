# Security Guidelines

## Critical Security Rules

### 1. Never Commit Credentials

**NEVER** commit the following to git:
- Passwords
- API keys
- SFTP credentials
- Database connection strings
- Authentication tokens
- Private keys

### 2. Use Environment Variables

Store all sensitive data in environment variables:

```bash
# Create .env file (already in .gitignore)
cp .env.example .env

# Edit .env with your actual credentials
nano .env
```

Example `.env` file:
```bash
SFTP_HOST=5018735097.ssh.w2.strato.hosting
SFTP_USER=su403214
SFTP_PASS=your-actual-password
```

### 3. Deployment Security

When deploying, load credentials from `.env`:

```bash
# Load environment variables
source .env

# Or export them inline
export SFTP_USER="..." && \
export SFTP_PASS="..." && \
curl --user "$SFTP_USER:$SFTP_PASS" ...
```

### 4. Git History Cleanup

If credentials were accidentally committed, you MUST:

1. **Change all exposed credentials immediately**
2. **Remove from git history** using:

```bash
# Remove file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch DEPLOYMENT.md" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: rewrites history)
git push origin --force --all
```

Or use BFG Repo-Cleaner:
```bash
# Install BFG
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Remove credentials
bfg --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

### 5. Regular Security Checks

- Review all `.md` files before committing
- Check for hardcoded credentials with:
  ```bash
  grep -r "password\|token\|secret\|key" --include="*.md" --include="*.sh"
  ```
- Use git hooks to prevent commits with secrets

### 6. Current Status

✅ All documentation files have been sanitized
✅ Credentials replaced with placeholders
✅ `.env.example` created with safe examples
✅ `.gitignore` updated to exclude `.env` files
✅ This `SECURITY.md` guide created

### 7. What to Do Next

1. **Immediately change your SFTP password** if it was pushed to GitHub
2. Review GitHub commit history to confirm credentials were removed
3. Enable GitHub secret scanning alerts
4. Consider using a secrets manager (e.g., 1Password, LastPass, AWS Secrets Manager)

### 8. Reporting Security Issues

If you discover a security vulnerability:
- Do NOT open a public GitHub issue
- Contact the repository owner directly
- Provide details of the vulnerability
- Allow time for the issue to be fixed before disclosure
