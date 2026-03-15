#!/bin/bash
# setup_wif.sh
# Usage: ./setup_wif.sh <github-owner/github-repo>
# Example: ./setup_wif.sh biibii/pam-shopify

if [ -z "$1" ]; then
  echo "Error: Please provide your GitHub repository as an argument (e.g., owner/repo)"
  echo "Usage: $0 <owner/repo>"
  exit 1
fi

GITHUB_REPO=$1
PROJECT_ID="psych-mastery-production"
POOL_NAME="pam-github-pool"
PROVIDER_NAME="pam-provider"

echo "Setting up Workload Identity Federation for $GITHUB_REPO..."

# 1. Enable IAM Credentials API
echo "Enabling IAM Credentials API..."
gcloud services enable iamcredentials.googleapis.com --project="$PROJECT_ID"

# 2. Create the Workload Identity Pool
echo "Creating Workload Identity Pool..."
gcloud iam workload-identity-pools create "$POOL_NAME" \
    --project="$PROJECT_ID" \
    --location="global" \
    --display-name="PAM GitHub Actions Pool" \
    --quiet || echo "Pool may already exist, continuing..."

# 3. Create the OIDC Provider
echo "Creating OIDC Provider..."
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
    --project="$PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="$POOL_NAME" \
    --display-name="PAM GitHub Actions Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --quiet || echo "Provider may already exist, continuing..."

# 4. Get Project Number
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
if [ -z "$PROJECT_NUMBER" ]; then
  echo "Error: Could not retrieve project number."
  exit 1
fi

echo "Project Number: $PROJECT_NUMBER"

# 5. Bind IAM policy to allow GitHub to impersonate the Service Account
echo "Binding IAM policy for GitHub impersonation..."
gcloud iam service-accounts add-iam-policy-binding "pam-worker-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/attribute.repository/$GITHUB_REPO" \
    --quiet

echo ""
echo "========================================================="
echo "✅ Setup Complete!"
echo "========================================================="
echo "Add this to your GitHub Repository Secrets:"
echo "1. GCP_PROJECT_ID: $PROJECT_ID"
echo "2. GCP_WORKLOAD_IDENTITY_PROVIDER:"
echo "   projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/providers/$PROVIDER_NAME"
echo "========================================================="
