---
name: repo-map
description: Map repository structure and identify likely touch points, risks, and validation steps for a requested change. Use when asked for codebase orientation, impact analysis, or where-to-edit guidance.
---

# Repo Map

## Procedure

1. Scan entrypoints and top-level folders relevant to the request.
2. Identify primary implementation paths and adjacent dependencies.
3. List likely risk points (state boundaries, data transformations, side effects).
4. Propose the smallest safe file set to modify.
5. Define validation steps for the touched paths.

## Output Template

- Request scope:
- Touched paths:
- Why these paths:
- Risk points:
- Validation steps:
- Out-of-scope paths intentionally avoided:

## References

- See `references/repo-layout.md` for current FocusFlow structure.