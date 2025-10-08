# Slack Deployment Notifications

Automatically sends Slack notifications when deployments complete, with customizable status, environment details, and deployment metadata.

## Quick Start

Add this to your deployment workflow:

```yaml
name: Slack Deployment

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # Your deployment steps here
      - name: Deploy to production
        run: |
          # deployment commands
        
  notify:
    needs: deploy
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-deployment.yaml@main
    with:
      channel_id: ${{ vars.SLACK_DEPLOYMENTS_CHANNEL }}
      status: ${{ needs.deploy.result }}
      environment: "production"
      tag: ${{ github.event.release.tag_name }}
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

## Required Configuration

### Repository Secrets

- **`SLACK_BOT_TOKEN`** - Your Slack bot token (starts with `xoxb-`)
  - Required scopes: `chat:write`, `chat:write.public`
  - [Create a Slack app and bot](https://api.slack.com/authentication/basics)

### Repository Variables

- **`SLACK_DEPLOYMENTS_CHANNEL`** - Slack channel ID for deployment notifications (e.g., `C01234ABCDE`)
  - Find it: Right-click channel → View channel details → Copy ID

## Workflow Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `channel_id` | **Yes** | - | Slack channel ID to send notification to |
| `status` | No | `success` | Deployment status: `success`, `failure`, `cancelled` |
| `environment` | No | `production` | Deployment environment (e.g., staging, production) |
| `title` | No | Auto-generated | Custom notification title (overrides default) |
| `body` | No | Auto-generated | Custom notification body (overrides default) |
| `tag` | No | - | Git tag associated with the deployment |
| `git_hash` | No | Current SHA | Git commit hash of deployed code |
| `deployment_time` | No | - | UNIX timestamp of when deployment occurred |
| `include_timestamp` | No | `true` | Show timestamp in notification |
| `include_repository` | No | `true` | Show repository information |

## Usage Examples

### Basic Deployment Notification

```yaml
jobs:
  deploy-and-notify:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy application
        run: ./deploy.sh
        
      - name: Notify Slack
        if: always()
        uses: lowranceworks/common-workflows/.github/workflows/slack-deployment.yaml@main
        with:
          channel_id: ${{ vars.SLACK_CHANNEL_ID }}
          status: ${{ job.status }}
          environment: "staging"
        secrets:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### Production Release with Full Details

```yaml
on:
  release:
    types: [published]

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        id: deploy
        run: |
          DEPLOY_TIME=$(date +%s)
          echo "deploy_time=$DEPLOY_TIME" >> $GITHUB_OUTPUT
          ./deploy.sh production
  
  notify:
    needs: deploy-production
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-deployment.yaml@main
    with:
      channel_id: ${{ vars.PROD_DEPLOYMENTS_CHANNEL }}
      status: ${{ needs.deploy-production.result }}
      environment: "production"
      tag: ${{ github.event.release.tag_name }}
      deployment_time: ${{ needs.deploy-production.outputs.deploy_time }}
      include_timestamp: true
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### Custom Notification Message

```yaml
- name: Notify with custom message
  uses: lowranceworks/common-workflows/.github/workflows/slack-deployment.yaml@main
  with:
    channel_id: ${{ vars.SLACK_CHANNEL_ID }}
    status: "success"
    title: "🎉 New Feature Deployed"
    body: "The new dashboard feature is now live in production!"
    environment: "production"
    tag: ${{ github.ref_name }}
  secrets:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### Multi-Environment Deployments

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: ./deploy.sh staging
  
  notify-staging:
    needs: deploy-staging
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-deployment.yaml@main
    with:
      channel_id: ${{ vars.STAGING_CHANNEL }}
      status: ${{ needs.deploy-staging.result }}
      environment: "staging"
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
  
  deploy-production:
    needs: deploy-staging
    if: success()
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy.sh production
  
  notify-production:
    needs: deploy-production
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-deployment.yaml@main
    with:
      channel_id: ${{ vars.PROD_CHANNEL }}
      status: ${{ needs.deploy-production.result }}
      environment: "production"
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

## Notification Format

The Slack notification includes:

- **Header** - Status emoji and title (✅ success, ❌ failure, ⚠️ cancelled)
- **Body** - Deployment message
- **Details**:
  - Environment
  - Git tag (if provided)
  - Commit hash (clickable link)
- **Repository** - Link to repo and branch
- **Timestamp** - When the deployment occurred (if provided)

### Status Colors

- **Success** 🚀 - Green
- **Failure** ❌ - Red
- **Cancelled** ⚠️ - Yellow
- **Other** ℹ️ - Gray

## Troubleshooting

**Notification not appearing?**

1. Check Actions logs for API errors
2. Verify bot has `chat:write` permissions
3. Ensure bot is added to the channel: `/invite @YourBot`
4. Confirm channel ID is correct (not channel name)

**Wrong deployment status?**

Use `${{ job.status }}` or `${{ needs.job-name.result }}` to capture the actual job result:
- `success` - Job completed successfully
- `failure` - Job failed
- `cancelled` - Job was cancelled
- `skipped` - Job was skipped

**Timestamp not showing?**

The `deployment_time` must be a UNIX timestamp (seconds since epoch):
```bash
DEPLOY_TIME=$(date +%s)
echo "deploy_time=$DEPLOY_TIME" >> $GITHUB_OUTPUT
```
