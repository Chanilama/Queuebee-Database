#!/bin/bash

# QueueBee Google Cloud Project Setup Script
echo "🐝 Setting up QueueBee on Google Cloud Platform..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
print_status "Google Cloud CLI is installed"

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated with Google Cloud."
    echo "Please run: gcloud auth login"
    exit 1
fi
print_status "Authenticated with Google Cloud"

# Project setup
echo ""
echo "🏗️  Project Setup"
echo "=================="

# Get or create project
read -p "Enter your Google Cloud Project ID (or press Enter to create new): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    # Generate project ID
    RANDOM_SUFFIX=$(date +%s | tail -c 6)
    PROJECT_ID="queuebee-${RANDOM_SUFFIX}"
    
    print_info "Creating new project: $PROJECT_ID"
    gcloud projects create $PROJECT_ID
    
    if [ $? -eq 0 ]; then
        print_status "Project created successfully"
    else
        print_error "Failed to create project"
        exit 1
    fi
fi

# Set current project
gcloud config set project $PROJECT_ID
print_status "Using project: $PROJECT_ID"

# Check billing
echo ""
echo "💳 Checking billing..."
BILLING_ENABLED=$(gcloud beta billing projects describe $PROJECT_ID --format="value(billingEnabled)" 2>/dev/null)

if [ "$BILLING_ENABLED" != "True" ]; then
    print_warning "Billing is not enabled for this project"
    print_info "Please enable billing at: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
    read -p "Press Enter after enabling billing to continue..."
fi

# Enable APIs
echo ""
echo "🔧 Enabling required APIs..."
APIS=(
    "cloudbuild.googleapis.com"
    "run.googleapis.com"
    "containerregistry.googleapis.com"
    "secretmanager.googleapis.com"
)

for API in "${APIS[@]}"; do
    echo "Enabling $API..."
    gcloud services enable $API
    if [ $? -eq 0 ]; then
        print_status "$API enabled"
    else
        print_error "Failed to enable $API"
    fi
done

# MongoDB Atlas setup
echo ""
echo "🍃 MongoDB Atlas Setup"
echo "======================"
print_info "You'll need a MongoDB Atlas account (free tier available)"
print_info "1. Go to https://cloud.mongodb.com/"
print_info "2. Create a free cluster"
print_info "3. Create a database user"
print_info "4. Whitelist all IPs (0.0.0.0/0) for Cloud Run access"
print_info "5. Get your connection string"

read -p "Enter your MongoDB connection string: " MONGO_URL

if [ -z "$MONGO_URL" ]; then
    print_error "MongoDB URL is required"
    exit 1
fi

# Store MongoDB URL in Secret Manager
echo "Storing MongoDB URL in Secret Manager..."
echo "$MONGO_URL" | gcloud secrets create mongo-url --data-file=-
print_status "MongoDB URL stored securely"

# Generate JWT Secret
echo ""
echo "🔐 Generating JWT Secret..."
JWT_SECRET=$(openssl rand -base64 32)
echo "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
print_status "JWT Secret generated and stored"

# Create service account
echo ""
echo "👤 Creating service account..."
SERVICE_ACCOUNT="queuebee-service"
gcloud iam service-accounts create $SERVICE_ACCOUNT \
    --description="QueueBee application service account" \
    --display-name="QueueBee Service"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

print_status "Service account created and configured"

# Update deployment files
echo ""
echo "⚙️  Updating deployment configuration..."

# Update cloudbuild files
sed -i.bak "s/\${_MONGO_URL}/projects\/${PROJECT_ID}\/secrets\/mongo-url\/versions\/latest/g" cloudbuild-backend.yaml
sed -i.bak "s/your-project-id/${PROJECT_ID}/g" cloudbuild-backend.yaml cloudbuild-frontend.yaml

print_status "Deployment files updated"

# Set up Cloud Build triggers (optional)
echo ""
read -p "Do you want to set up automatic deployments with Cloud Build triggers? (y/n): " SETUP_TRIGGERS

if [ "$SETUP_TRIGGERS" = "y" ] || [ "$SETUP_TRIGGERS" = "Y" ]; then
    print_info "You can set up Cloud Build triggers in the console:"
    print_info "https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
fi

# Display summary
echo ""
echo "🎉 Setup Complete!"
echo "=================="
print_status "Project ID: $PROJECT_ID"
print_status "APIs enabled: Cloud Build, Cloud Run, Container Registry, Secret Manager"
print_status "MongoDB URL stored in Secret Manager"
print_status "JWT Secret generated and stored"
print_status "Service account created with proper permissions"

echo ""
echo "🚀 Next Steps:"
echo "1. Run ./deploy.sh to deploy QueueBee"
echo "2. Your URLs will be:"
echo "   - Backend: https://queuebee-backend-[hash].a.run.app"
echo "   - Frontend: https://queuebee-frontend-[hash].a.run.app"
echo ""
echo "💰 Estimated costs (light usage):"
echo "   - Cloud Run: $5-20/month"
echo "   - MongoDB Atlas: Free tier available"
echo "   - Cloud Build: Free tier: 120 minutes/day"
echo ""
print_info "Ready to deploy? Run: ./deploy.sh"