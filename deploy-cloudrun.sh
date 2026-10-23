#!/usr/bin/env bash
# ==============================================================================
# NIDPIK Express Backend Cloud Run Deployment Script
# Target GCP Project: gen-lang-client-0205908126
# Target Cloud SQL Instance: gen-lang-client-0205908126:asia-southeast1:ai-studio-f8b66661
# ==============================================================================

set -eo pipefail

PROJECT_ID="gen-lang-client-0205908126"
REGION="asia-southeast1"
SERVICE_NAME="nidpik-backend"
CLOUD_SQL_INSTANCE="gen-lang-client-0205908126:asia-southeast1:ai-studio-f8b66661"
DB_NAME="cloud_sql_development_database"
DB_USER="ai_studio_app_user"

if [ -z "${ADMIN_OWNER_PASSWORD}" ]; then
  if [ -f ".admin_secret.tmp" ]; then
    ADMIN_OWNER_PASSWORD=$(cat .admin_secret.tmp)
  else
    echo "ERROR: ADMIN_OWNER_PASSWORD environment variable is required."
    exit 1
  fi
fi

echo "=========================================================="
echo " Deploying NIDPIK Express Backend to Cloud Run"
echo " Project:   ${PROJECT_ID}"
echo " Region:    ${REGION}"
echo " Service:   ${SERVICE_NAME}"
echo " SQL Inst:  ${CLOUD_SQL_INSTANCE}"
echo " DB Name:   ${DB_NAME}"
echo " DB User:   ${DB_USER}"
echo "=========================================================="

# Target GCP Project
gcloud config set project "${PROJECT_ID}"

# Deploy to Cloud Run with Cloud SQL connection
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances "${CLOUD_SQL_INSTANCE}" \
  --set-env-vars "INSTANCE_CONNECTION_NAME=${CLOUD_SQL_INSTANCE},SQL_USER=${DB_USER},SQL_PASSWORD=${SQL_PASSWORD},SQL_DB_NAME=${DB_NAME},ADMIN_OWNER_EMAIL=admin@nidpik.com,ADMIN_OWNER_PASSWORD=${ADMIN_OWNER_PASSWORD},NODE_ENV=production" \
  --port 8080

echo "----------------------------------------------------------"
echo " Deployment submission complete!"
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format 'value(status.url)')
echo " Service URL: ${SERVICE_URL}"
echo " Health Check Response:"
curl -s "${SERVICE_URL}/api/health"
echo "----------------------------------------------------------"
