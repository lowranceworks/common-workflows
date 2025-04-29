# Slack Pull Request Review Notifications

Automatically sends Slack notifications when pull request reviews are needed.

## Quick Start

Add this workflow to your repository at `.github/workflows/pr-review-notifications.yaml`:

```yaml
name: PR Review Notifications

on:
  pull_request:
    types: [opened, review_requested, ready_for_review]

jobs:
  notify-team:
    uses: lowranceworks/common-workflows/.github/workflows/slack-pr-review.yaml@main
    with:
      team-slug: "engineering"
      team-display-name: "Engineering Team"
      slack-channel-id: ${{ vars.SLACK_CHANNEL_ID }}
    secrets:
      slack_bot_token: ${{ secrets.SLACK_BOT_TOKEN }}
    permissions:
      pull-requests: read
```

## Required Configuration

### Repository Secrets

Set these in your repository settings (Settings → Secrets and variables → Actions):

- **`SLACK_BOT_TOKEN`** - Your Slack bot token (starts with `xoxb-`)
  - Required scopes: `chat:write`, `chat:write.public`
  - [Create a Slack app and bot](https://api.slack.com/authentication/basics)

### Repository Variables

- **`SLACK_CHANNEL_ID`** - The Slack channel ID (e.g., `C01234ABCDE`)
  - Find it: Right-click channel → View channel details → Copy ID

## Workflow Inputs

| Input | Required | Description | Example |
|-------|----------|-------------|---------|
| `team-slug` | Yes | GitHub team identifier | `engineering` |
| `team-display-name` | Yes | Human-readable team name for Slack | `Engineering Team` |
| `slack-channel-id` | Yes | Slack channel to notify | `C01234ABCDE` |

## Multiple Teams Setup

To notify different teams in different channels, create separate workflow files:

**`.github/workflows/pr-review-backend.yaml`**
```yaml
name: Backend PR Reviews

on:
  pull_request:
    types: [opened, review_requested, ready_for_review]

jobs:
  notify-backend:
    uses: lowranceworks/common-workflows/.github/workflows/slack-pr-review.yaml@main
    with:
      team-slug: "backend"
      team-display-name: "Backend Team"
      slack-channel-id: ${{ vars.BACKEND_SLACK_CHANNEL }}
    secrets:
      slack_bot_token: ${{ secrets.SLACK_BOT_TOKEN }}
    permissions:
      pull-requests: read
```

**`.github/workflows/pr-review-frontend.yaml`**
```yaml
name: Frontend PR Reviews

on:
  pull_request:
    types: [opened, review_requested, ready_for_review]

jobs:
  notify-frontend:
    uses: lowranceworks/common-workflows/.github/workflows/slack-pr-review.yaml@main
    with:
      team-slug: "frontend"
      team-display-name: "Frontend Team"
      slack-channel-id: ${{ vars.FRONTEND_SLACK_CHANNEL }}
    secrets:
      slack_bot_token: ${{ secrets.SLACK_BOT_TOKEN }}
    permissions:
      pull-requests: read
```

## Testing

1. Create a test pull request in your repository
2. Request a review from the configured team
3. Check your Slack channel for the notification

The notification should include:
- PR title and number
- Author
- Link to the PR
- Team being requested for review

## Troubleshooting

**No notifications appearing?**

1. **Check workflow run logs** - Go to Actions tab and review the run for errors
2. **Verify Slack bot permissions** - Bot needs `chat:write` scope
3. **Confirm channel access** - Bot must be added to the target channel (`/invite @YourBot`)
4. **Check team slug** - Must exactly match your GitHub team identifier
5. **Validate channel ID** - Ensure you're using the channel ID, not the channel name

**Bot can't post to channel?**

Add the bot to the channel: `/invite @YourBot` in the Slack channel

**Wrong team being notified?**

Verify the `team-slug` input matches your GitHub organization's team slug exactly (case-sensitiv
