# Pull Request Guideline
To maintain software quality, ensure that all pull requests satisfy the following rules:

1. **Self-Review**: Verify the branch builds locally before submission.
2. **Atomic Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) schema (e.g. `feat(auth): ...` or `fix(storage): ...`).
3. **Multi-Tenant Safety Check**: Ensure all database queries route via Repository layers and check context tenancy.
4. **Automated Testing**: Ensure all unit test assertions execute successfully.
5. **No Credentials**: Double check no secrets or local `.env` variables are included in the diff.
