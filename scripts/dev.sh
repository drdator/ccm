#!/bin/bash

# CCM Development Environment Setup Script

set -e

echo "🚀 Setting up CCM Development Environment..."

# Install dependencies for all workspaces
echo "📦 Installing dependencies..."
npm install

# Create storage directory for API
mkdir -p api/storage/commands

# Start the API server (SQLite will be auto-created)
echo "🚀 Starting API server..."
npm run dev:api &
API_PID=$!

# Wait a moment for API to start
sleep 3

echo "✅ Development environment is ready!"
echo ""
echo "📋 Services:"
echo "  • API Server: http://localhost:3000 (SQLite database)"
echo "  • Web Interface: Run 'npm run dev:web' for http://localhost:8080"
echo ""
echo "🔧 Useful commands:"
echo "  • Start API: npm run dev:api"
echo "  • Start Web: npm run dev:web"
echo "  • Start CLI dev: npm run dev:cli"
echo ""
echo "🧪 Test the API:"
echo "  curl http://localhost:3000/health"
echo ""
echo "📋 To stop API server: kill $API_PID"