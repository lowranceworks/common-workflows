# Common Workflows

A collection of reusable GitHub Actions workflows to standardize CI/CD practices across repositories.

## Why?

**Don't Repeat Yourself.** Write quality automation once, reuse it everywhere.

This repository provides battle-tested workflows that handle common development tasks—from validating PRs to deploying releases. Instead of copying and maintaining the same workflow logic across dozens of repositories, reference these centralized workflows and keep your CI/CD pipeline consistent and maintainable.

## Quick Start

Reference a workflow in your `.github/workflows/` directory:

```yaml
name: Validate PR Labels
on:
  pull_request:
    types: [opened, labeled, unlabeled]

jobs:
  check-semver-label:
    uses: lowranceworks/common-workflows/.github/workflows/semver-label-check.yaml@main
    with:
      # Add any required inputs here
```

## Available Workflows

### Pull Request Workflows
Run when PRs are opened or updated to validate and notify.

- **[semver-label-check](docs/semver-label-check.md)** - Ensures PRs have semantic versioning labels (major/minor/patch)
- **[slack-pr-review](docs/slack-pr-review.md)** - Notifies your team when reviews are needed

### Post-Merge Workflows
Automatically run after code is merged to your main branch.

- **[build-zip-upload-artifactory](docs/build-zip-upload-artifactory.md)** - Builds and uploads ZIP artifacts to Artifactory
- **[create-tag-and-release](docs/create-tag-and-release.md)** - Automatically creates Git tags and GitHub releases
- **[slack-artifact-build](docs/slack-artifact-build.md)** - Sends build status notifications to Slack

### Deployment Workflows
Run after releases are created to notify about deployments.

- **[slack-deployment](docs/slack-deployment.md)** - Sends deployment notifications to Slack

## Examples

Check the [`examples/`](examples/) directory for ready-to-use workflow files organized by when they run:

- **`on-pull-request/`** - Validation and review notification workflows
- **`after-merge/`** - Build, release, and notification workflows
- **`after-release/`** - Deployment notification workflows

## Usage Tips

### Pinning Versions

For production use, pin to a specific version instead of `@main`:

```yaml
uses: lowranceworks/common-workflows/.github/workflows/semver-label-check.yaml@v1.2.3
```

### Required Secrets

Most workflows require repository secrets to be configured:

- `ARTIFACTORY_URL` and `ARTIFACTORY_TOKEN` - For artifact uploads
- `SLACK_WEBHOOK_URL` - For Slack notifications
- GitHub token is automatically provided via `secrets.GITHUB_TOKEN`

### Permissions

Reusable workflows may need specific permissions. Always include the `permissions` block:

```yaml
jobs:
  my-job:
    uses: lowranceworks/common-workflows/.github/workflows/create-tag-and-release.yaml@main
    permissions:
      contents: write
      pull-requests: read
```

## Contributing

Improvements and new workflows are welcome! Please:

1. Follow the existing structure and naming conventions
2. Add documentation in the `docs/` directory
3. Include a working example in `examples/`
4. Test thoroughly before submitting a PR

## License

[Add your license here]
