---
name: pre-pr-ci
description: >
  Run all CI checks before creating a pull request, and fix any issues found.
  Use this skill whenever the user is about to create a PR, push to remote,
  or asks to "run CI", "check before PR", "verify changes", "ověř změny",
  "spusť CI", "oprav chyby" or similar. Always run this before creating a PR
  — don't skip it.
---

Run each CI check as a separate command so the user gets a complete picture
even if multiple steps fail. The project uses Biome (lint), TypeScript (tsc),
Vitest (tests), and Vite (build).

## Phase 1 — Run all checks

Run these four commands independently from the project root, capturing both
stdout and stderr for each:

1. **Lint** — `npm run lint`
2. **Types** — `npx tsc --noEmit`
3. **Tests** — `npm run test`
4. **Build** — `npm run build`

Don't chain them — run each one separately so a failure in step 1 doesn't
hide failures in steps 2–4.

## Phase 2 — Report and fix failures

After all four run, report using this format:

```
## CI Results

| Check | Status |
|-------|--------|
| Lint  | ✅ Pass |
| Types | ❌ Fail |
| Tests | ✅ Pass |
| Build | ✅ Pass |
```

If any check failed, attempt to fix the issues:

### Lint failures
Run `npx biome check --write src/` to auto-fix formatting and lint errors,
then re-run `npm run lint` to confirm it's clean.

### Type errors (tsc)
Read the failing files, understand the type errors from the tsc output, and
fix them by editing the source. Re-run `npx tsc --noEmit` to confirm.

### Test failures
Read the test output to understand which tests fail and why. Read both the
test file and the source file it tests. Fix the source (or the test if it's
clearly wrong). Re-run `npm run test` to confirm.

### Build failures
Read the build error output, identify the cause (usually an import error or
missing type), fix it, and re-run `npm run build` to confirm.

## Phase 3 — Final report

After attempting all fixes, run the full `npm run ci` once more to get a
clean final result.

- **All pass** → Tell the user CI is green and they can proceed to create
  the PR.
- **Still failing** → Show what remains broken and explain what needs manual
  attention before the PR can be created.
