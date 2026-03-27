#!/bin/bash
# Deploy Teen Patti backend to Railway
# Usage: ./deploy.sh

set -euo pipefail

echo "🎴 Teen Patti Server Deployment"
echo "================================"

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install: npm i -g @railway/cli"
    exit 1
fi

# Check we're in the server directory
if [ ! -f "package.json" ] || [ ! -f "Dockerfile" ]; then
    echo "❌ Run this from the server/ directory"
    exit 1
fi

echo "📦 Building TypeScript..."
npm run build

echo "🧪 Running type check..."
npx tsc --noEmit

echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo "   Run 'railway logs' to monitor"
echo "   Run 'railway open' to view dashboard"
