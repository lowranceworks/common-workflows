# Common Workflows

A collection of reusable GitHub Actions workflows to standardize CI/CD practices across repositories.

## Why Use Common Workflows?

As part of any DevOps strategy, developers should look to formulate a best-practices policy for all their employees to follow internally. This set of best practices will ensure that everyone on your team is on the same page and working to the same standard. One of the key principles that any DevOps strategy should embrace is that of DRY coding. While it may sound like a tasty cocktail, [DevOps and DRY](https://dzone.com/articles/devops-and-dry) (Don't Repeat Yourself) embrace the ideals that you should only write quality code once, the first time.

## Available Workflows

### Artifacts

- [zip-to-artifactory](docs/artifacts/zip-to-artifactory.md) - Builds and pushes a ZIP archive to Artifactory

### Notifications

- [slack-build-status](docs/notifications/slack-build-status.md) - Sends build status notifications to Slack
- [slack-deployment-status](docs/notifications/slack-deployment-status.md) - Sends deployment status updates to Slack
- [slack-pull-request-review-needed](docs/notifications/slack-pull-request-review-needed.md) - Notifies teams when PR review is needed

### Releases

- [create-tag-and-release](docs/releases/create-tag-and-release.md) - Creates a new Git tag and GitHub release

### Validations

- [semver-label-check](docs/validations/semver-label-check.md) - Validates semantic versioning labels on PRs

## How to Use

To use a workflow in your repository, reference it in your workflow file:

```yaml
name: Example Usage
on:
  pull_request:
    types: [closed]
jobs:
  create-release:
    uses: lowranceworks/common-workflows/.github/workflows/releases/create-tag-and-release.yaml@main
    with:
      # Required inputs for the workflow
    permissions:
      contents: write
      pull-requests: read
```
