#!/bin/bash

# Production deployment script

echo "🚀 Starting CapyIDE production deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm run test:run

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Aborting deployment."
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

# Build Docker image
echo "🐳 Building Docker image..."
npm run docker:build

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed. Aborting deployment."
    exit 1
fi

# Deploy with docker-compose
echo "🚀 Deploying with docker-compose..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed."
    exit 1
fi

echo "✅ Deployment successful!"
echo "🌐 Application should be available at:"
echo "   - Client: http://localhost:3000"
echo "   - Server: http://localhost:8787"
echo "   - Health check: http://localhost:8787/health"