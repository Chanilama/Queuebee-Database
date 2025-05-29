# QueueBee Google Cloud Deployment Guide

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **MongoDB Atlas Account** (free tier available)
3. **Google Cloud CLI** installed locally

## Quick Setup

### 1. Install Google Cloud CLI
```bash
# macOS
brew install google-cloud-sdk

# Windows
# Download from: https://cloud.google.com/sdk/docs/install

# Linux
curl https://sdk.cloud.google.com | bash
```

### 2. Authenticate and Setup Project
```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create queuebee-prod-123
gcloud config set project queuebee-prod-123

# Enable billing (required for Cloud Run)
# Go to: https://console.cloud.google.com/billing
```

### 3. Setup MongoDB Atlas (Database)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free cluster
3. Create database user
4. Whitelist all IPs (0.0.0.0/0) for Cloud Run
5. Get connection string

### 4. Deploy QueueBee
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## Manual Deployment Steps

If you prefer manual deployment:

### Backend Deployment
```bash
# Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# Build and deploy backend
gcloud builds submit --config cloudbuild-backend.yaml .

# Update environment variables
gcloud run services update queuebee-backend \
  --set-env-vars MONGO_URL="your-mongodb-connection-string" \
  --region us-central1
```

### Frontend Deployment
```bash
# Update backend URL in frontend/.env
# Then build and deploy
gcloud builds submit --config cloudbuild-frontend.yaml .
```

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/queuebee
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://queuebee-backend-xyz.a.run.app
```

## Custom Domain Setup

### 1. Map Custom Domain
```bash
# Map your domain to Cloud Run
gcloud run domain-mappings create \
  --service queuebee-frontend \
  --domain app.yourdomain.com \
  --region us-central1
```

### 2. Update DNS
Add the provided DNS records to your domain registrar.

## Cost Optimization

### Free Tier Limits
- **Cloud Run**: 2 million requests/month free
- **Cloud Build**: 120 build minutes/day free
- **MongoDB Atlas**: 512MB storage free

### Production Optimization
```bash
# Set minimum instances for faster response
gcloud run services update queuebee-backend \
  --min-instances 1 \
  --region us-central1

# Enable CPU allocation only during requests
gcloud run services update queuebee-backend \
  --cpu-allocate-during-request-only \
  --region us-central1
```

## Monitoring and Logs

### View Logs
```bash
# Backend logs
gcloud run services logs tail queuebee-backend --region us-central1

# Frontend logs  
gcloud run services logs tail queuebee-frontend --region us-central1
```

### Monitor Performance
- Go to [Cloud Console](https://console.cloud.google.com/)
- Navigate to Cloud Run > Services
- View metrics and performance

## Security Best Practices

### 1. Environment Variables
- Never commit secrets to code
- Use Google Secret Manager for production:

```bash
# Store MongoDB URL in Secret Manager
echo "mongodb+srv://..." | gcloud secrets create mongo-url --data-file=-

# Update Cloud Run to use secret
gcloud run services update queuebee-backend \
  --set-env-vars MONGO_URL="projects/PROJECT_ID/secrets/mongo-url/versions/latest" \
  --region us-central1
```

### 2. IAM and Permissions
```bash
# Create service account for Cloud Run
gcloud iam service-accounts create queuebee-service

# Grant minimal permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:queuebee-service@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check build logs
   gcloud builds list
   gcloud builds log BUILD_ID
   ```

2. **Service Won't Start**
   ```bash
   # Check service logs
   gcloud run services logs tail SERVICE_NAME --region us-central1
   ```

3. **Database Connection Issues**
   - Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
   - Check connection string format
   - Ensure database user has read/write permissions

### Update Deployment
```bash
# To update, simply run the deploy script again
./deploy.sh

# Or trigger builds manually
gcloud builds submit --config cloudbuild-backend.yaml .
gcloud builds submit --config cloudbuild-frontend.yaml .
```

## Production Checklist

- [ ] Custom domain configured
- [ ] SSL certificate (automatic with Cloud Run)
- [ ] Environment variables secured
- [ ] MongoDB Atlas security configured
- [ ] Monitoring and alerting setup
- [ ] Backup strategy for database
- [ ] Error tracking (optional: Sentry)
- [ ] CDN setup for static assets (optional)

## Support

For deployment issues:
1. Check Google Cloud Status: https://status.cloud.google.com/
2. MongoDB Atlas Status: https://status.cloud.mongodb.com/
3. Review Cloud Run documentation: https://cloud.google.com/run/docs