#!/bin/bash

# QueueBee Google Cloud Deployment Script
echo "🐝 Deploying QueueBee to Google Cloud..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with Google Cloud. Please run:"
    echo "gcloud auth login"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No Google Cloud project selected. Please run:"
    echo "gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "🏗️  Using Google Cloud Project: $PROJECT_ID"

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Set environment variables
echo "⚙️  Setting up environment variables..."
echo "Please provide your MongoDB connection string:"
read -p "MongoDB URL (mongodb+srv://...): " MONGO_URL

if [ -z "$MONGO_URL" ]; then
    echo "❌ MongoDB URL is required"
    exit 1
fi

# Update cloudbuild files with MongoDB URL
sed -i "s|mongodb+srv://your-username:your-password@your-cluster.mongodb.net/queuebee|$MONGO_URL|g" cloudbuild-backend.yaml

# Deploy Backend
echo "🚀 Deploying Backend to Cloud Run..."
gcloud builds submit --config cloudbuild-backend.yaml .

# Get backend URL
BACKEND_URL=$(gcloud run services describe queuebee-backend --region=us-central1 --format="value(status.url)")
echo "✅ Backend deployed at: $BACKEND_URL"

# Update frontend environment variable
echo "⚙️  Updating frontend configuration..."
sed -i "s|https://.*preview.emergentagent.com|$BACKEND_URL|g" frontend/.env

# Deploy Frontend
echo "🚀 Deploying Frontend to Cloud Run..."
gcloud builds submit --config cloudbuild-frontend.yaml .

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe queuebee-frontend --region=us-central1 --format="value(status.url)")

echo ""
echo "🎉 QueueBee Deployment Complete!"
echo "======================================="
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔗 Backend URL: $BACKEND_URL"
echo ""
echo "📱 Public Check-in URLs will be in the format:"
echo "$FRONTEND_URL/checkin/{salon_id}"
echo ""
echo "🎯 Next Steps:"
echo "1. Visit $FRONTEND_URL to access QueueBee"
echo "2. Create your salon account"
echo "3. Get your public check-in URL from the dashboard"
echo "4. Share the check-in link with your customers!"
echo ""
echo "💰 Estimated Monthly Cost (Light Usage):"
echo "- Cloud Run Frontend: $2-5/month"
echo "- Cloud Run Backend: $5-15/month" 
echo "- MongoDB Atlas (Free Tier): $0/month"
echo "- Total: ~$7-20/month"