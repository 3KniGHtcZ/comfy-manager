---
name: pre-pr-ci
description: >
  Run all CI checks before creating a pull request. Use this skill whenever
  the user is about to create a PR, push to remote, or asks to "run CI",
  "check before PR", "verify changes", "ověř změny", "spusť CI" or similar.
  Always run this before creating a PR — don't skip it.
---

Run each CI check as a separate command so the user gets a complete picture
even if multiple steps fail. The project uses Biome (lint), TypeScript (tsc),
Vitest (tests), and Vite (build).

## Steps

Run these four commands independently from the project root, capturing both
stdout and stderr for each:

1. **Lint** — `npm run lint`
2. **Types** — `npx tsc --noEmit`
3. **Tests** — `npm run test`
4. **Build** — `npm run build`

Don't chain them — run each one separately so a failure in step 1 doesn't
hide failures in steps 2–4.

## Reporting

After all four complete, report using this format:

```
## CI Results

| Check | Status |
|-------|--------|
| Lint  | ✅ Pass |
| Types | ❌ Fail |
| Tests | ✅ Pass |
| Build | ✅ Pass |
```

For each failed step, show the relevant error output (trimmed to what's
actionable — skip noise like progress bars or build summaries).

## Next steps

- **All pass** → Tell the user CI is green and they can proceed to create
  the PR. Offer to run `/commit` or create the PR directly.
- **Any fail** → Tell the user to fix the issues first and list what needs
  attention. Don't create the PR.
