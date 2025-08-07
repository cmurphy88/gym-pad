# Branch Protection Setup

To automatically require tests to pass before merging PRs, set up branch protection rules:

## GitHub Settings

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** for the `main` branch

## Recommended Protection Rules

### Required Settings:
- ✅ **Require a pull request before merging**
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

### Required Status Checks:
Add these status checks as required:
- `Test & Lint` (from pr-check.yml)
- `test (20)` (from test.yml - if using the full workflow)
- `build` (from test.yml - if using the build check)

### Additional Recommended Settings:
- ✅ **Restrict pushes that create files that match a pattern** 
  - Pattern: `tests/**/*.test.js` (prevents bypassing tests)
- ✅ **Require linear history** (optional - keeps git history clean)
- ✅ **Include administrators** (applies rules to all users)

## Environment Variables

For the workflows to run properly, no additional secrets are needed since:
- Tests use in-memory database (`file::memory:?cache=shared`)
- Test environment variables are set in the workflow files
- No real database connections are made

## Workflow Status

Once set up, PRs will show:
- ✅ **Tests passing** - All 91 unit tests pass
- ✅ **Linting passed** - Code style requirements met  
- ✅ **Database safety verified** - No real database connections
- 🚀 **Safe to merge** - All requirements satisfied

## Testing the Setup

1. Create a test branch with a small change
2. Open a PR to `main`
3. Verify the workflow runs automatically
4. Check that merge is blocked until tests pass