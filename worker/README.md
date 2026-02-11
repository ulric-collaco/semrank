# Worker Folder

This folder contains the Cloudflare Worker that serves as the API backend for SemRank.

## Quick Start

```bash
# Install dependencies
npm install

# Test locally
npm run dev
# Access: http://localhost:8787/api

# Deploy to Cloudflare
npm run deploy

# View real-time logs
npm run tail

# Test endpoints
npm test
```

## Files

- **src/index.js** - Main worker code with all API endpoints
- **package.json** - Dependencies and scripts
- **test-api.js** - Node.js test script
- **test-api.ps1** - PowerShell test script
- **test-api.sh** - Bash test script

## Testing

### Test Local Instance
```bash
npm run test:local
```

### Test Remote Instance
```bash
# After deploying
npm test https://your-worker.workers.dev
```

### Manual Testing
```bash
# PowerShell
.\test-api.ps1 https://your-worker.workers.dev

# Bash
./test-api.sh https://your-worker.workers.dev

# Node
node test-api.js https://your-worker.workers.dev
```

## API Endpoints

See [../QUICKSTART.md](../QUICKSTART.md) for full list of endpoints.

## Configuration

The worker is configured via `../wrangler.toml`. Make sure to set your D1 database_id there.

## Development

The worker automatically:
- Handles CORS for frontend access
- Validates input parameters
- Calculates CGPA from marks
- Aggregates attendance data
- Returns consistent JSON responses

## Troubleshooting

**Worker not starting:**
```bash
# Check wrangler is installed
wrangler --version

# Reinstall if needed
npm install -g wrangler
```

**Database connection errors:**
- Verify database_id in `wrangler.toml`
- Check database exists: `wrangler d1 list`

**CORS errors:**
- CORS is already configured
- Check browser console for specific error

For more help, see [../CLOUDFLARE_SETUP.md](../CLOUDFLARE_SETUP.md)
