# Workflow Examples

This directory contains ready-to-use GitHub Actions workflow examples organized by when they run in your development lifecycle.

## Structure

```
examples/
├── on-pull-request/    # Workflows that run when PRs are opened or updated
├── after-merge/        # Workflows that run after PRs are merged to main
└── after-release/      # Workflows that run after a GitHub release is created
```

## Available Workflows

### On Pull Request
Workflows that validate and notify when pull requests are created or updated.

- **`semver-label.yaml`** - Validates that PRs have proper semantic versioning labels
- **`slack-pr-review.yaml`** - Sends Slack notifications when PR reviews are needed

### After Merge
Workflows that run automatically after code is merged to your main branch.

- **`build-zip-upload-artifactory.yaml`** - Builds your project, zips artifacts, and uploads to Artifactory
- **`create-tag-and-release.yaml`** - Automatically creates Git tags and GitHub releases
- **`slack-artifact-build.yaml`** - Notifies Slack about build status and artifact uploads

### After Release
Workflows that run after a GitHub release is published.

- **`slack-deployment.yaml`** - Sends deployment notifications to Slack channels

## Usage

1. Copy the workflow file you need to your repository's `.github/workflows/` directory
2. Update any repository-specific values (Slack webhooks, Artifactory URLs, etc.)
3. Commit and push to trigger the workflow

## Requirements

These workflows may require:
- GitHub secrets configured for authentication (Artifactory, Slack webhooks, etc.)
- Proper repository permissions
- Specific labels or branch protection rules

Refer to individual workflow files for specific requirements and configuration options.
