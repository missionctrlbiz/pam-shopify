# setup_wif.ps1
# Usage: .\setup_wif.ps1 -GitHubRepo "owner/repo"
# Example: .\setup_wif.ps1 -GitHubRepo "biibii/pam-shopify"

param (
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepo
)

$PROJECT_ID = "psych-mastery-production"
$POOL_NAME = "pam-github-pool"
$PROVIDER_NAME = "pam-provider"

Write-Host "Setting up Workload Identity Federation for $GitHubRepo..." -ForegroundColor Cyan

# 1. Enable IAM Credentials API
Write-Host "Enabling IAM Credentials API..." -ForegroundColor DarkGray
gcloud services enable iamcredentials.googleapis.com --project="$PROJECT_ID"

# 2. Create the Workload Identity Pool
Write-Host "Creating Workload Identity Pool..." -ForegroundColor DarkGray
try {
    gcloud iam workload-identity-pools create "$POOL_NAME" `
        --project="$PROJECT_ID" `
        --location="global" `
        --display-name="PAM GitHub Actions Pool" `
        --quiet 2>$null
} catch {
    Write-Host "Pool may already exist, continuing..." -ForegroundColor Yellow
}

# 3. Create the OIDC Provider
Write-Host "Creating OIDC Provider..." -ForegroundColor DarkGray
try {
    gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" `
        --project="$PROJECT_ID" `
        --location="global" `
        --workload-identity-pool="$POOL_NAME" `
        --display-name="PAM GitHub Actions Provider" `
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" `
        --issuer-uri="https://token.actions.githubusercontent.com" `
        --quiet 2>$null
} catch {
    Write-Host "Provider may already exist, continuing..." -ForegroundColor Yellow
}

# 4. Get Project Number
Write-Host "Retrieving Project Number..." -ForegroundColor DarkGray
$PROJECT_NUMBER = gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)'

if ([string]::IsNullOrEmpty($PROJECT_NUMBER)) {
    Write-Host "Error: Could not retrieve project number." -ForegroundColor Red
    Exit
}

Write-Host "Project Number: $PROJECT_NUMBER" -ForegroundColor Green

# 5. Bind IAM policy to allow GitHub to impersonate the Service Account
Write-Host "Binding IAM policy for GitHub impersonation..." -ForegroundColor DarkGray
gcloud iam service-accounts add-iam-policy-binding "pam-worker-sa@$PROJECT_ID.iam.gserviceaccount.com" `
    --project="$PROJECT_ID" `
    --role="roles/iam.workloadIdentityUser" `
    --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/attribute.repository/$GitHubRepo" `
    --quiet

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "Add this to your GitHub Repository Secrets:"
Write-Host "1. GCP_PROJECT_ID: $PROJECT_ID"
Write-Host "2. GCP_WORKLOAD_IDENTITY_PROVIDER:"
Write-Host "   projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/providers/$PROVIDER_NAME"
Write-Host "========================================================="
