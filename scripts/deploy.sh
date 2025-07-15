#!/bin/bash

# CCM Deployment Script
# This script automates the deployment process for CCM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_info "Creating .env from .env.example..."
    cp .env.example .env
    print_info "Please edit .env file with your configuration"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "your-256-bit-secret-key-here-change-this-in-production" ]; then
    print_error "JWT_SECRET not set or using default value!"
    print_info "Generate a secure secret with: openssl rand -hex 32"
    exit 1
fi

# Build or pull images
print_info "Building Docker images..."
docker-compose build

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose down

# Start services
print_info "Starting services..."
docker-compose up -d

# Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 10

# Check service health
print_info "Checking service health..."
API_HEALTH=$(docker-compose exec -T api wget -q -O - http://localhost:3000/health || echo "unhealthy")
WEB_HEALTH=$(docker-compose exec -T web wget -q -O - http://localhost/health || echo "unhealthy")

if [[ "$API_HEALTH" == *"healthy"* ]] || [[ "$API_HEALTH" == *"ok"* ]]; then
    print_success "API service is healthy"
else
    print_error "API service is not healthy"
fi

if [[ "$WEB_HEALTH" == *"healthy"* ]]; then
    print_success "Web service is healthy"
else
    print_error "Web service is not healthy"
fi

# Show running containers
print_info "Running containers:"
docker-compose ps

# Show logs tail
print_info "Recent logs:"
docker-compose logs --tail=20

print_success "Deployment complete!"
print_info "Access the application at:"
print_info "  Web: http://localhost"
print_info "  API: http://localhost:3000"
print_info ""
print_info "To view logs: docker-compose logs -f"
print_info "To stop services: docker-compose down"