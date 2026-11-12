# Create Tag and Release

Automatically creates Git tags and GitHub releases when pull requests are merged, with version bumps determined by semver labels.

## Quick Start

Add this workflow to `.github/workflows/release.yaml`:

```yaml
name: Create Release

on:
  pull_request:
    types: [closed]

jobs:
  create-tag-and-release:
    if: github.event.pull_request.merged == true
    uses: lowranceworks/common-workflows/.github/workflows/create-tag-and-release.yaml@main
    permissions:
      contents: write
      pull-requests: read
    secrets: inherit
```

## How It Works

When a PR is merged to your main branch, this workflow:

1. **Reads the semver label** from the merged PR (`patch`, `minor`, or `major`)
2. **Fetches the latest tag** in the repository
3. **Calculates the new version** based on the label
4. **Creates a Git tag** with the new version
5. **Creates a GitHub release** pointing to that tag

### Version Bumping

| PR Label | Current Version | New Version |
|----------|----------------|-------------|
| `patch` | `v1.2.3` | `v1.2.4` |
| `minor` | `v1.2.3` | `v1.3.0` |
| `major` | `v1.2.3` | `v2.0.0` |

## Required Configuration

### Permissions

```yaml
permissions:
  contents: write      # Required to create tags and releases
  pull-requests: read  # Required to read PR labels
```

### Required Labels

Your repository must have these labels (same as semver-label-check):
- `patch` - Bug fixes and minor updates
- `minor` - New features (backwards-compatible)
- `major` - Breaking changes

`patch change`/`minor change`/`major change` and `patch release`/`minor release`/`major release` are accepted as aliases. Exactly one version label (canonical or alias) is required; unrelated labels are ignored. Missing or multiple version labels, including an alias alongside its canonical name, fail validation before any tag or release is created. There is no default patch bump.

## Recommended Setup

**Use with semver-label-check for best results:**

This workflow works best when combined with the [semver-label-check](./semver-label-check.md) workflow to enforce labels before merging.

**`.github/workflows/semver-check.yaml`**
```yaml
name: Semver Label Check

on:
  pull_request:
    types: [opened, labeled, unlabeled, synchronize]

jobs:
  check-version:
    uses: lowranceworks/common-workflows/.github/workflows/semver-label-check.yaml@main
    permissions:
      issues: write
      pull-requests: write
      contents: read
```

**`.github/workflows/release.yaml`**
```yaml
name: Create Release

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
    secrets: inherit
```

This setup ensures:
- ✅ Every PR must have a semver label (enforced by status check)
- ✅ Releases are automatically created with correct version on merge
- ✅ No manual version management needed

## Usage Examples

### Basic Automatic Releases

```yaml
name: Auto Release

on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  release:
    if: github.event.pull_request.merged == true
    uses: lowranceworks/common-workflows/.github/workflows/create-tag-and-release.yaml@main
    permissions:
      contents: write
      pull-requests: read
    secrets: inherit
```

### With Deployment Notification

```yaml
name: Release and Deploy

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
    secrets: inherit
  
  deploy-production:
    needs: create-release
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy.sh production
  
  notify:
    needs: deploy-production
    if: always()
    uses: lowranceworks/common-workflows/.github/workflows/slack-deployment.yaml@main
    with:
      channel_id: ${{ vars.SLACK_DEPLOYMENTS_CHANNEL }}
      status: ${{ needs.deploy-production.result }}
      environment: "production"
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### Multi-Branch Strategy

```yaml
name: Release Strategy

on:
  pull_request:
    types: [closed]
    branches: [main, develop]

jobs:
  release-production:
    if: |
      github.event.pull_request.merged == true &&
      github.event.pull_request.base.ref == 'main'
    uses: lowranceworks/common-workflows/.github/workflows/create-tag-and-release.yaml@main
    permissions:
      contents: write
      pull-requests: read
    secrets: inherit
  
  release-staging:
    if: |
      github.event.pull_request.merged == true &&
      github.event.pull_request.base.ref == 'develop'
    uses: lowranceworks/common-workflows/.github/workflows/create-tag-and-release.yaml@main
    permissions:
      contents: write
      pull-requests: read
    secrets: inherit
```

## Release Details

The workflow automatically generates:

### Git Tag
- Format: `v{major}.{minor}.{patch}` (e.g., `v1.2.3`)
- Points to the merge commit

### GitHub Release
- **Title**: Version number (e.g., `v1.2.3`)
- **Tag**: The created tag
- **Release Notes**: Auto-generated from PR title and description
- **Assets**: None by default (can be added in subsequent jobs)

## Complete Workflow Example

Here's a full automation setup from PR to release:

```yaml
# .github/workflows/pr-checks.yaml
name: PR Checks

on:
  pull_request:
    types: [opened, labeled, unlabeled, synchronize]

jobs:
  semver-check:
    uses: lowranceworks/common-workflows/.github/workflows/semver-label-check.yaml@main
    permissions:
      issues: write
      pull-requests: write
      contents: read
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
  
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
```

```yaml
# .github/workflows/release.yaml
name: Release

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
    secrets: inherit
  
  build-artifacts:
    needs: create-release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build release artifacts
        run: npm run build:production
      
      - name: Upload to release
        uses: softprops/action-gh-release@v1
        with:
          files: dist/*
          tag_name: ${{ needs.create-release.outputs.tag }}
```

## Troubleshooting

**No release created after merge?**

1. Verify the PR was merged (not closed without merging)
2. Check that the PR has exactly one semver label (`patch`, `minor`, `major`, or a corresponding `* change`/`* release` alias)
3. Ensure the workflow has `contents: write` permission
4. Review the Actions logs for specific errors

**Wrong version number?**

The workflow calculates versions based on:
- The latest Git tag in the repository
- The semver label on the merged PR

If no tag is reachable from the merged commit, the workflow uses `v0.1.0` as its baseline: `minor` creates `v0.2.0`, and `patch` creates `v0.1.1`. It chooses the baseline with `git describe --tags --abbrev=0`, which can differ from the pre-merge check's tag API result when tags are not on the current history.

**Release created but can't push to protected branch?**

If your `main` branch is protected, you may need to:
1. Allow the GitHub Actions bot to bypass branch protection
2. Or use a personal access token with elevated permissions

**Multiple releases created?**

This can happen if multiple PRs are merged simultaneously. Consider using a concurrency group:

```yaml
jobs:
  create-release:
    if: github.event.pull_request.merged == true
    concurrency:
      group: release
      cancel-in-progress: false
    uses: lowranceworks/common-workflows/.github/workflows/create-tag-and-release.yaml@main
    permissions:
      contents: write
      pull-requests: read
```

## Best Practices

1. **Always use semver-label-check** - Enforce labels before merge
2. **Enable branch protection** - Require status checks to pass
3. **Use conventional commits** - Makes release notes more meaningful
4. **Pin workflow versions** - Use `@v1.0.0` instead of `@main` in production
5. **Test in a staging repo** - Verify behavior before rolling out team-wide

## References

- [Semantic Versioning](https://semver.org/)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semver Label Check Workflow](./semver-label-check.md)
