#!/bin/bash

# CCM Development Environment Setup Script

set -e

echo "🐳 Starting CCM Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create storage directory for API
mkdir -p api/storage/commands

# Start PostgreSQL database
echo "🚀 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migrations
echo "🔄 Running database migrations..."
cd api && npm run migrate && cd ..

# Start the API server
echo "🚀 Starting API server..."
docker-compose up -d api

echo "✅ Development environment is ready!"
echo ""
echo "📋 Services:"
echo "  • PostgreSQL: localhost:5432"
echo "  • API Server: http://localhost:3000"
echo ""
echo "🔧 Useful commands:"
echo "  • View logs: docker-compose logs -f"
echo "  • Stop services: docker-compose down"
echo "  • Reset database: docker-compose down -v && ./scripts/dev.sh"
echo ""
echo "🧪 Test the API:"
echo "  curl http://localhost:3000/health"