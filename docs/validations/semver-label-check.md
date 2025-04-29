# Version Label Check

## Why do we need this workflow?

If someone creates a pull-request, we want to ensure that a `label` containing the [semantic version]() is attached.

Think of this workflow as a `status-check` to ensure that developers are defining the impact of their changes in a pull-request:

- **MAJOR**: version when you make incompatible API changes
- **MINOR**: version when you add functionality in a backward compatible manner
- **PATCH**: version when you make backward compatible bug fixes

When this workflow is included in a repository, a developer has to add a `label` to their pull-request **before they're allowed to merge the pull-request**.

If a developer fails to do this before the workflow is executed, the `bot` will leave a comment on the pull-request instructing them to add a label:

```STDOUT
### Version Label Status

❌ **Error:** No version label found!

This PR requires exactly one of the following labels:
- `patch`: backwards-compatible bug fixes
- `minor`: backwards-compatible features
- `major`: breaking changes

Please add one label to specify the type of version change.
```

Once the label has been added to the pull-request, the `bot` will comment on the pull-request describing the semantic version increment:

```STDOUT
### Version Label Status

✅ **Success:** Valid version label found: `minor`

This PR will trigger a version increment when merged:
`v1.1.0` → `v1.2.0`

- **Minor** version increment (new features, backwards compatible)
```

## References

[semver.org](https://semver.org/)
