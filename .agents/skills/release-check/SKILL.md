---
name: release-check
description: Run pre-commit or pre-PR quality checks and summarize readiness. Use when validating a change, preparing a pull request, or performing a review gate.
---

# Release Check

## Procedure

1. Read the `eslint.config.js` to understand the specific rules in place.
2. Run `npm run lint` and `npm run type-check`.
3. Read the output. If there are failures, immediately offer to fix them, or explain why they are irrelevant (e.g. they pre-date your change). Do not just state "Lint Failed".
4. Run `npm run build` to ensure the project packages correctly. For Electron on Windows, `build` uses `electron-builder`. Be aware of `ERR_ELECTRON_BUILDER_CANNOT_EXECUTE` which often happens due to network blocks preventing github binary downloads.
5. If there are Vitest unit tests in the project, run `npm test`.

## Output Template

Provide a clear and concise summary to the user:
- **Build Status**: `PASS/FAIL/SKIP`
- **Lint Status**: `PASS/FAIL/SKIP`
- **Type Check**: `PASS/FAIL/SKIP`
- **Test Status**: `PASS/FAIL/SKIP`

Identify the specific blockers and provide a short script (or offer an automated fix via agents) for resolving them.