---
name: release-check
description: Run pre-commit or pre-PR quality checks and summarize readiness. Use when validating a change, preparing a pull request, or performing a review gate.
---

# Release Check

## Procedure

1. Run `cmd /c npm run lint`.
2. Run `cmd /c npm run build`.
3. Record failures as blockers and non-failing concerns as warnings.
4. Provide a minimal fix order for blockers.
5. Return a readiness verdict.

## Classification Rules

- Blocker: failed command, type error, lint error, build failure.
- Warning: non-blocking concerns, potential risks, missing optional checks.

## Output Template

- Commands run:
- Blockers:
- Warnings:
- Suggested fix order:
- Readiness verdict: `READY` or `NOT READY`

## References

- See `references/checklist.md` for FocusFlow baseline checks.