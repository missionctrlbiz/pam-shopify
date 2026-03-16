#!/bin/bash
# Script to create placeholder secrets in GCP Secret Manager

# Ensure gcloud is configured
PROJECT_ID=$(gcloud config get-value project)
echo "Creating secrets in project: $PROJECT_ID"

SECRETS=(
  "pam-supabase-anon-key"
  "pam-supabase-url"
  "pam-supabase-service-role"
)

for secret in "${SECRETS[@]}"; do
  if ! gcloud secrets describe "$secret" >/dev/null 2>&1; then
    echo "Creating secret: $secret"
    gcloud secrets create "$secret" --replication-policy="automatic"
    echo -n "REPLACE_WITH_SUPABASE_VALUE" | gcloud secrets versions add "$secret" --data-file=-
  else
    echo "Secret $secret already exists."
  fi
done

echo ""
echo "Secrets created with placeholder values."
echo "Please update them in the Google Cloud Console:"
echo "https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID"
