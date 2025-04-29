# Slack Artifact Build Notifications

Automatically sends Slack notifications when artifact builds complete, with customizable status, artifact details, and build metadata.

## Quick Start

Add this to your build workflow:

```yaml
name: Build and Notify

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Build artifact
        run: |
          # Your build commands
          npm run build
          
      - name: Upload to Artifactory
        id: upload
        run: |
          # Upload logic
          echo "artifact_url=https://artifactory.example.com/my-app-v1.0.0.zip" >> $GITHUB_OUTPUT
  
  notify:
    needs: build
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-artifact-build.yaml@main
    with:
      channel_id: ${{ vars.SLACK_BUILDS_CHANNEL }}
      status: ${{ needs.build.result }}
      artifact_name: "my-app-v1.0.0.zip"
      artifact_url: ${{ needs.build.outputs.artifact_url }}
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

## Required Configuration

### Repository Secrets

- **`SLACK_BOT_TOKEN`** - Your Slack bot token (starts with `xoxb-`)
  - Required scopes: `chat:write`, `chat:write.public`
  - [Create a Slack app and bot](https://api.slack.com/authentication/basics)

### Repository Variables

- **`SLACK_BUILDS_CHANNEL`** - Slack channel ID for build notifications (e.g., `C01234ABCDE`)
  - Find it: Right-click channel → View channel details → Copy ID

## Workflow Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `channel_id` | **Yes** | - | Slack channel ID to send notification to |
| `status` | No | `success` | Build status: `success`, `failure`, `cancelled` |
| `artifact_name` | No | - | Name of the built artifact |
| `artifact_url` | No | - | URL to the built artifact (makes artifact_name clickable) |
| `tag` | No | - | Git tag associated with the build |
| `git_hash` | No | Current SHA | Git commit hash of the build |
| `build_time` | No | - | UNIX timestamp of when build occurred |
| `title` | No | Auto-generated | Custom notification title (overrides default) |
| `body` | No | Auto-generated | Custom notification body (overrides default) |
| `include_timestamp` | No | `true` | Show timestamp in notification |
| `include_repository` | No | `true` | Show repository information |

## Usage Examples

### Basic Build Notification

```yaml
jobs:
  build-and-notify:
    runs-on: ubuntu-latest
    steps:
      - name: Build application
        run: npm run build
        
      - name: Notify Slack
        if: always()
        uses: lowranceworks/common-workflows/.github/workflows/slack-artifact-build.yaml@main
        with:
          channel_id: ${{ vars.SLACK_CHANNEL_ID }}
          status: ${{ job.status }}
        secrets:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### Build with Artifact Upload

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact_url: ${{ steps.upload.outputs.url }}
      artifact_name: ${{ steps.build.outputs.name }}
    steps:
      - name: Build artifact
        id: build
        run: |
          npm run build
          VERSION=$(jq -r .version package.json)
          ARTIFACT_NAME="my-app-${VERSION}.zip"
          zip -r $ARTIFACT_NAME dist/
          echo "name=$ARTIFACT_NAME" >> $GITHUB_OUTPUT
      
      - name: Upload to Artifactory
        id: upload
        run: |
          ARTIFACT_URL="https://artifactory.example.com/repo/${{ steps.build.outputs.name }}"
          curl -H "X-JFrog-Art-Api: ${{ secrets.ARTIFACTORY_TOKEN }}" \
               -T ${{ steps.build.outputs.name }} \
               $ARTIFACT_URL
          echo "url=$ARTIFACT_URL" >> $GITHUB_OUTPUT
  
  notify:
    needs: build
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-artifact-build.yaml@main
    with:
      channel_id: ${{ vars.SLACK_CHANNEL_ID }}
      status: ${{ needs.build.result }}
      artifact_name: ${{ needs.build.outputs.artifact_name }}
      artifact_url: ${{ needs.build.outputs.artifact_url }}
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### Tagged Release Build

```yaml
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Build release artifact
        id: build
        run: |
          BUILD_TIME=$(date +%s)
          echo "build_time=$BUILD_TIME" >> $GITHUB_OUTPUT
          ./build.sh release
  
  notify:
    needs: build
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-artifact-build.yaml@main
    with:
      channel_id: ${{ vars.SLACK_RELEASES_CHANNEL }}
      status: ${{ needs.build.result }}
      artifact_name: "release-${{ github.ref_name }}.tar.gz"
      artifact_url: "https://releases.example.com/${{ github.ref_name }}.tar.gz"
      tag: ${{ github.ref_name }}
      build_time: ${{ needs.build.outputs.build_time }}
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### Custom Build Notification

```yaml
- name: Notify with custom message
  uses: lowranceworks/common-workflows/.github/workflows/slack-artifact-build.yaml@main
  with:
    channel_id: ${{ vars.SLACK_CHANNEL_ID }}
    status: "success"
    title: "🎉 Production Build Complete"
    body: "New production artifacts are ready for deployment!"
    artifact_name: "production-bundle.zip"
    artifact_url: "https://cdn.example.com/production-bundle.zip"
  secrets:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### Multiple Artifact Notifications

```yaml
jobs:
  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Build frontend
        run: npm run build:frontend
  
  notify-frontend:
    needs: build-frontend
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-artifact-build.yaml@main
    with:
      channel_id: ${{ vars.SLACK_CHANNEL_ID }}
      status: ${{ needs.build-frontend.result }}
      artifact_name: "frontend-bundle.js"
      title: "Frontend Build Complete"
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
  
  build-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Build backend
        run: cargo build --release
  
  notify-backend:
    needs: build-backend
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-artifact-build.yaml@main
    with:
      channel_id: ${{ vars.SLACK_CHANNEL_ID }}
      status: ${{ needs.build-backend.result }}
      artifact_name: "backend-binary"
      title: "Backend Build Complete"
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

## Notification Format

The Slack notification includes:

- **Header** - Status emoji and title (🏗️ success, ❌ failure, ⚠️ cancelled)
- **Body** - Build status message
- **Details** (if provided):
  - Artifact name (clickable if URL provided)
  - Git tag (clickable link)
  - Commit hash (clickable link)
- **Repository** - Link to repo and branch
- **Timestamp** - When the build occurred (if provided)

### Status Colors

- **Success** 🏗️ - Green
- **Failure** ❌ - Red
- **Cancelled** ⚠️ - Yellow
- **Other** ℹ️ - Gray

## Troubleshooting

**Notification not appearing?**

1. Check Actions logs for API errors
2. Verify bot has `chat:write` permissions
3. Ensure bot is added to the channel: `/invite @YourBot`
4. Confirm channel ID is correct (not channel name)

**Artifact link not working?**

Make sure both `artifact_name` and `artifact_url` are provided. If only `artifact_name` is given, it will display as plain text.

**Wrong build status?**

Use `${{ job.status }}` for the current job or `${{ needs.job-name.result }}` for dependent jobs:
- `success` - Build completed successfully
- `failure` - Build failed
- `cancelled` - Build was cancelled
- `skipped` - Build was skipped

**Timestamp not showing?**

The `build_time` must be a UNIX timestamp (seconds since epoch):
```bash
BUILD_TIME=$(date +%s)
echo "build_time=$BUILD_TIME" >> $GITHUB_OUTPUT
```

Then pass it to the workflow:
```yaml
build_time: ${{ needs.build.outputs.build_time }}
```
