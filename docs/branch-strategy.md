# Branch Strategy

To ensure code stability, we enforce the following Git branch hierarchy:

```
main      (Production - strictly stable)
  ▲
develop   (Staging / Integration - automatically deployed to staging)
  ▲
feature/* (Feature developments - merged via PR only)
hotfix/*  (Urgent production patches - merged directly to main)
```

## Commit Message Policy (Conventional Commits)
All commit messages must be prefixed with their action type:
- `feat(...)`: A new feature (e.g., `feat(auth): add MFA verification support`)
- `fix(...)`: A bug fix (e.g., `fix(storage): resolve quota increment bug`)
- `docs(...)`: Documentation changes (e.g., `docs(git): write branching docs`)
- `chore(...)`: General maintenance (e.g., `chore(deps): update helmet`)
- `test(...)`: Adding or updating tests
