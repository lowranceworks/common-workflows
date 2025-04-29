# Slack Pull Request Review Needed

## Why do we need this workflow?

We want Github Actions to send us a notification via Slack when a review is needed on a pull-request.

## Required GitHub Secrets

Set up these secrets in your repository:

- `SLACK_BOT_TOKEN`: A Slack bot token (`xoxb-...`) with the `chat:write` scope
- `DEVOPS_TEAM_SLACK_CHANNEL_ID`: Slack channel ID to receive notifications

## How to Use for Additional Teams

To set up notifications for another team (e.g., "dev-team"):

1. Create a new workflow file:

```yaml
name: Dev Team PR Notifications

on:
  pull_request:
    types: [opened, review_requested, ready_for_review]

jobs:
  notify-dev-team:
    name: Notify Dev Team for Pull Request Review
    uses: ./.github/workflows/notifications/slack-pull-request-review.yaml
    with:
      team-slug: "dev"
      team-display-name: "Dev Team"
      slack-channel-id: ${{ secrets.DEV_TEAM_SLACK_CHANNEL_ID }}
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

2. Add the corresponding secret (in this example `DEV_TEAM_SLACK_CHANNEL_ID`) to the repository.

## How It Works

```
# TODO: finish this
```

## Testing

To test if your setup is working:

1. Create a pull request in your repository
2. Request a review from the team you've configured
3. Check if the notification appears in the corresponding Slack channel

## Troubleshooting

If notifications aren't working:

1. Check the GitHub Actions run logs for errors
2. Verify that your Slack bot has the proper permissions
3. Ensure the team slug exactly matches what's in GitHub
4. Confirm the Slack channel ID is correct
