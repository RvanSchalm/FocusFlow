# AGENTS.md

This is the canonical instruction source for working in this repository.
It is intentionally model/IDE agnostic and applies to Codex, Antigravity, Claude, and similar coding agents.

## Scope

- Follow this file as the default operating guide for all tasks in this repo.
- Keep changes minimal, explicit, and easy to review.
- Prefer small, focused PRs over broad mixed changes.

## Repository Map

- `src/`: renderer application (React + TypeScript UI).
- `src/services/dataService.ts`: renderer data access/service layer.
- `electron/main.ts`: Electron main process (desktop app lifecycle + storage IPC handlers).
- `electron/preload.ts`: Electron preload bridge exposed to renderer.

## Standard Workflow

1. Inspect context:
- Read relevant files and current behavior first.
- Identify exactly what is in scope and what is out of scope.

2. Propose minimal change:
- Implement the smallest viable change set that satisfies the request.
- Avoid unrelated refactors in the same PR.

3. Run checks:
- Run `cmd /c npm run lint`.
- Run `cmd /c npm run build`.
- Run a focused smoke test for touched behavior.

4. Summarize outcome:
- List what changed and why.
- Report risks, assumptions, and verification results.

## Change Boundaries

- Do not modify unrelated files.
- Keep docs and code aligned with actual implementation.
- When creating reusable agent workflows, place them in `.agents/skills/`.

## Skills Contract

Skill folders use this shape:

```text
.agents/skills/<skill-name>/
  SKILL.md
  scripts/      (optional)
  references/   (optional)
  assets/       (optional)
```

`SKILL.md` is required. Other folders are optional and should only be added when useful.