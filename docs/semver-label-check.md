# Semver Label Check

Validates that pull requests have semantic versioning labels before they can be merged, ensuring developers explicitly define the impact of their changes.

## Quick Start

Add this workflow to `.github/workflows/semver-check.yaml`:

```yaml
name: Semver Label Check

on:
  pull_request:
    types: [opened, labeled, unlabeled, synchronize]

jobs:
  semver-label-check:
    uses: lowranceworks/common-workflows/.github/workflows/semver-label-check.yaml@main
    permissions:
      issues: write
      pull-requests: write
      contents: read
```

## Required Configuration

### Required Labels

Create these labels in your repository (Settings → Labels):

- **`patch`** - Backwards-compatible bug fixes
- **`minor`** - Backwards-compatible new features
- **`major`** - Breaking changes

### Required Permissions

The workflow needs these permissions to validate labels and post comments:
```yaml
permissions:
  issues: write
  pull-requests: write
  contents: read
```

## How It Works

This workflow acts as a **status check** that blocks PRs from merging until a semantic version label is added.

### Semantic Versioning

Pull requests must be labeled with the type of change according to [semver.org](https://semver.org/):

| Label | Version Change | Use For |
|-------|----------------|---------|
| `patch` | `v1.2.3` → `v1.2.4` | Bug fixes, small improvements, documentation |
| `minor` | `v1.2.3` → `v1.3.0` | New features that don't break existing functionality |
| `major` | `v1.2.3` → `v2.0.0` | Breaking changes, removed features, API changes |

### Workflow Behavior

**When no label is present:**

The workflow fails and posts a comment:

```
### Version Label Status
❌ **Error:** No version label found!

This PR requires exactly one of the following labels:
- `patch`: backwards-compatible bug fixes
- `minor`: backwards-compatible features
- `major`: breaking changes

Please add one label to specify the type of version change.
```

**When a valid label is added:**

The workflow passes and posts a comment:

```
### Version Label Status
✅ **Success:** Valid version label found: `minor`

This PR will trigger a version increment when merged:
`v1.1.0` → `v1.2.0`

- **Minor** version increment (new features, backwards compatible)
```

**When multiple labels are present:**

The workflow fails and asks the developer to use only one version label.

## Usage Examples

### Basic Setup

```yaml
name: Validate PR Labels

on:
  pull_request:
    types: [opened, labeled, unlabeled, synchronize]

jobs:
  check-semver:
    uses: lowranceworks/common-workflows/.github/workflows/semver-label-check.yaml@main
    permissions:
      issues: write
      pull-requests: write
      contents: read
```

### With Branch Protection

Enable this workflow as a required status check:

1. Go to Settings → Branches → Branch protection rules
2. Add or edit a rule for `main`
3. Enable "Require status checks to pass before merging"
4. Search for and select the semver check job name
5. Save the rule

Now PRs **cannot be merged** without a valid semver label.

### Combined with Other Checks

```yaml
name: PR Validation

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
  
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run linter
        run: npm run lint
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
```

## Best Practices

### Label Guidelines for Teams

**Use `patch` for:**
- Bug fixes
- Documentation updates
- Dependency updates (non-breaking)
- Performance improvements
- Refactoring (no behavior change)

**Use `minor` for:**
- New features
- New API endpoints
- Optional new parameters
- Deprecation notices (not removal)
- Backwards-compatible enhancements

**Use `major` for:**
- Breaking API changes
- Removing features
- Changing existing behavior
- Required parameter changes
- Database schema changes that require migration

### Automated Release Workflow

Combine with the `create-tag-and-release` workflow for automatic versioning:

```yaml
# .github/workflows/semver-check.yaml
name: Semver Check
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

# .github/workflows/release.yaml
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
```

This ensures:
1. Every PR has a semver label (enforced by status check)
2. When merged, a release is automatically created with the correct version bump

## Troubleshooting

**Workflow not running?**

Check that your workflow triggers include all necessary PR events:
```yaml
on:
  pull_request:
    types: [opened, labeled, unlabeled, synchronize]
```

**Labels not found?**

Ensure you've created the required labels in your repository:
- Go to Settings → Labels
- Create `patch`, `minor`, and `major` labels
- Color doesn't matter, but use distinct colors for easy identification

**Status check not blocking merge?**

Enable branch protection and require the status check:
1. Settings → Branches → Add rule
2. Enable "Require status checks to pass before merging"
3. Select the semver check job

**Bot not commenting?**

Verify the workflow has proper permissions:
```yaml
permissions:
  issues: write
  pull-requests: write
  contents: read
```

## References

- [Semantic Versioning Specification](https://semver.org/)
- [GitHub Labels Documentation](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels)
