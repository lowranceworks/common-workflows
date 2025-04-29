# Create Tag and Release

This workflow will first create a `tag` and then a `release` that refers to the `tagged commit`. The semantic version is determined by the `label` in a pull request.

I recommend using this workflow in conjunction with the [version-label-check]() workflow.
