# Build Zip and Upload to Artifactory

Automatically creates a ZIP archive of your repository and uploads it to Artifactory using the latest Git tag as the version identifier.

## Quick Start

Add this workflow to `.github/workflows/build-and-upload.yaml`:

```yaml
name: Build and Upload Artifact

on:
  push:
    branches: [main]

jobs:
  build-zip-and-upload-to-artifactory:
    uses: lowranceworks/common-workflows/.github/workflows/build-zip-upload-artifactory.yaml@main
    with:
      artifactory_url: "https://artifactory.example.com"
      artifactory_repo: "my-artifacts"
      artifact_path: "project-name"
    secrets:
      ARTIFACTORY_TOKEN: ${{ secrets.ARTIFACTORY_TOKEN }}
    permissions:
      contents: read
```

## How It Works

This workflow:

1. **Checks out your repository** code
2. **Fetches the latest Git tag** to use as the version
3. **Creates a ZIP archive** of your repository (excluding `.git` directory)
4. **Uploads to Artifactory** at the specified path with the tag as the filename

### Artifact Naming

The uploaded artifact follows this pattern:
```
{artifactory_repo}/{artifact_path}/{tag}.zip
```

**Example:**
- Repository: `my-artifacts`
- Path: `frontend-app`
- Tag: `v1.2.3`
- Result: `https://artifactory.example.com/my-artifacts/frontend-app/v1.2.3.zip`

## Required Configuration

### Repository Secrets

Set these in your repository settings (Settings → Secrets and variables → Actions):

- **`ARTIFACTORY_TOKEN`** - Artifactory API token or password
  - Generate in Artifactory: User menu → Edit Profile → Generate API Key
  - Or use your Artifactory password

### Workflow Inputs

| Input | Required | Description | Example |
|-------|----------|-------------|---------|
| `artifactory_url` | **Yes** | Base URL of your Artifactory instance | `https://artifactory.example.com` |
| `artifactory_repo` | **Yes** | Artifactory repository name | `my-artifacts` |
| `artifact_path` | **Yes** | Path within the repository | `project-name` or `team/project` |
| `artifactory_username` | No | Artifactory username (defaults to GitHub actor) | `ci-user` |

### Permissions

```yaml
permissions:
  contents: read  # Required to checkout code and read tags
```

## Usage Examples

### Basic Upload After Merge

```yaml
name: Build and Upload

on:
  push:
    branches: [main]

jobs:
  upload-artifact:
    uses: lowranceworks/common-workflows/.github/workflows/build-zip-upload-artifactory.yaml@main
    with:
      artifactory_url: "https://artifactory.company.com"
      artifactory_repo: "releases"
      artifact_path: "my-app"
    secrets:
      ARTIFACTORY_TOKEN: ${{ secrets.ARTIFACTORY_TOKEN }}
    permissions:
      contents: read
```

### Upload with Custom Username

```yaml
jobs:
  upload-artifact:
    uses: lowranceworks/common-workflows/.github/workflows/build-zip-upload-artifactory.yaml@main
    with:
      artifactory_url: "https://artifactory.company.com"
      artifactory_repo: "snapshots"
      artifact_path: "backend/api"
      artifactory_username: "ci-bot"
    secrets:
      ARTIFACTORY_TOKEN: ${{ secrets.CI_BOT_ARTIFACTORY_TOKEN }}
    permissions:
      contents: read
```

### Complete Release Pipeline

```yaml
name: Release Pipeline

on:
  pull_request:
    types: [closed]

jobs:
  create-release:
    if: github.event.pull_request.merged == true
    uses: lowranceworks/common-workflows/.github/workflows/create-tag-and-release.yaml@main
    permissions:
      contents: write
      pull-requests: read
  
  build-and-upload:
    needs: create-release
    uses: lowranceworks/common-workflows/.github/workflows/build-zip-upload-artifactory.yaml@main
    with:
      artifactory_url: ${{ vars.ARTIFACTORY_URL }}
      artifactory_repo: "production-releases"
      artifact_path: "my-app"
    secrets:
      ARTIFACTORY_TOKEN: ${{ secrets.ARTIFACTORY_TOKEN }}
    permissions:
      contents: read
  
  notify-build:
    needs: build-and-upload
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-artifact-build.yaml@main
    with:
      channel_id: ${{ vars.SLACK_BUILDS_CHANNEL }}
      status: ${{ needs.build-and-upload.result }}
      artifact_name: "${{ needs.create-release.outputs.tag }}.zip"
      artifact_url: "${{ vars.ARTIFACTORY_URL }}/production-releases/my-app/${{ needs.create-release.outputs.tag }}.zip"
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### Team-Based Artifact Paths

```yaml
# Different teams upload to different paths
jobs:
  upload-frontend:
    uses: lowranceworks/common-workflows/.github/workflows/build-zip-upload-artifactory.yaml@main
    with:
      artifactory_url: "https://artifactory.company.com"
      artifactory_repo: "artifacts"
      artifact_path: "frontend-team/web-app"
    secrets:
      ARTIFACTORY_TOKEN: ${{ secrets.ARTIFACTORY_TOKEN }}
    permissions:
      contents: read
  
  upload-backend:
    uses: lowranceworks/common-workflows/.github/workflows/build-zip-upload-artifactory.yaml@main
    with:
      artifactory_url: "https://artifactory.company.com"
      artifactory_repo: "artifacts"
      artifact_path: "backend-team/api-service"
    secrets:
      ARTIFACTORY_TOKEN: ${{ secrets.ARTIFACTORY_TOKEN }}
    permissions:
      contents: read
```

### Tagged Release Only

```yaml
name: Release Artifacts

on:
  push:
    tags:
      - 'v*'

jobs:
  upload-release:
    uses: lowranceworks/common-workflows/.github/workflows/build-zip-upload-artifactory.yaml@main
    with:
      artifactory_url: ${{ vars.ARTIFACTORY_URL }}
      artifactory_repo: "releases"
      artifact_path: "production/my-service"
    secrets:
      ARTIFACTORY_TOKEN: ${{ secrets.ARTIFACTORY_TOKEN }}
    permissions:
      contents: read
```

## What Gets Included

The ZIP archive includes:
- ✅ All repository files and directories
- ✅ All submodules (if any)
- ❌ `.git` directory (excluded)
- ❌ Files in `.gitignore` (may be included)

### Customizing Archive Contents

To control what gets archived, create a custom build step before calling this workflow:

```yaml
jobs:
  prepare-and-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build application
        run: npm run build
      
      - name: Create clean artifact
        run: |
          mkdir -p artifact
          cp -r dist/ artifact/
          cp package.json artifact/
          cp README.md artifact/
      
      - name: Create ZIP
        run: |
          cd artifact
          zip -r ../release.zip .
      
      # Then upload the custom ZIP using your own curl command
      - name: Upload to Artifactory
        run: |
          TAG=$(git describe --tags --abbrev=0)
          curl -H "X-JFrog-Art-Api: ${{ secrets.ARTIFACTORY_TOKEN }}" \
               -T release.zip \
               "${{ vars.ARTIFACTORY_URL }}/my-repo/my-app/${TAG}.zip"
```

## Artifactory Setup

### Creating a Repository

1. Log into Artifactory as admin
2. Navigate to Administration → Repositories → Local
3. Click "New Local Repository"
4. Select "Generic" as the package type
5. Set repository key (e.g., `my-artifacts`)
6. Configure retention policies as needed
7. Click "Create"

### Generating API Token

1. Click your user icon → Edit Profile
2. Scroll to "Authentication Settings"
3. Click "Generate API Key"
4. Copy the key and save it as `ARTIFACTORY_TOKEN` in GitHub secrets

### Setting Permissions

Ensure your user/token has:
- `deploy` permission on the target repository
- `read` permission (for verification)

## Troubleshooting

**No tag found error?**

This workflow requires at least one Git tag to exist. Either:
1. Create a manual tag: `git tag v1.0.0 && git push origin v1.0.0`
2. Use the `create-tag-and-release` workflow first to create tags automatically

**Upload fails with 401 Unauthorized?**

1. Verify your `ARTIFACTORY_TOKEN` is correct
2. Check the token has deploy permissions for the repository
3. Ensure the token hasn't expired

**Upload fails with 403 Forbidden?**

Your token doesn't have permission to deploy to the specified repository:
1. Check repository permissions in Artifactory
2. Verify the repository name is correct
3. Contact your Artifactory admin to grant deploy permissions

**Wrong artifact uploaded?**

The workflow zips the entire repository as-is. To upload only built artifacts:
1. Build your application first
2. Create a custom upload step (see "Customizing Archive Contents" above)
3. Or modify the workflow to accept a custom path to zip

**File already exists error?**

Artifactory may be configured to prevent overwriting. Either:
1. Allow overwrites in Artifactory repository settings
2. Delete the existing artifact before uploading
3. Use unique version tags (recommended)

## Best Practices

1. **Use with automatic releases** - Combine with `create-tag-and-release` for versioned artifacts
2. **Separate repositories by environment** - Use different Artifactory repos for dev/staging/prod
3. **Implement retention policies** - Clean up old artifacts automatically in Artifactory
4. **Use repository variables** - Store `ARTIFACTORY_URL` as a repository variable for easy updates
5. **Monitor storage usage** - Large repositories can consume significant Artifactory storage
6. **Consider build artifacts only** - For production, upload only compiled/built files, not source code

## References

- [JFrog Artifactory Documentation](https://jfrog.com/help/r/jfrog-artifactory-documentation)
- [Artifactory REST API](https://jfrog.com/help/r/jfrog-rest-apis/artifactory-rest-api)
- [Create Tag and Release Workflow](./create-tag-and-release.md)
