Could you analyse the codebase for me and specifically the md files. Can you make a plan for improving the instructions and creating skills? I want to optimize the repository for Agentic Coding and it feels a bit slugish now with only the CLAUDE.md file. PLease suggest improvements and include new structures where necessary. In addition, go over the code of the application and see what improvements can be made. These can be functioanlities, but also the code architecture. 
6 previous messages
I’ll analyze the repository first (especially Markdown docs and current app architecture), then propose a decision-complete plan to improve agent instructions, add skills, and speed up agentic workflows. I’m starting with a fast inventory of docs and core code paths.
I found the repo layout and confirmed key docs (CLAUDE.md, README.md, ELECTRON_GUIDE.md). rg is unavailable in this environment, so I’m switching to PowerShell-native file discovery and then reading the Markdown and app entrypoints.
I’m using the skill-creator skill for this turn because you explicitly want better instructions plus new skills. Next I’ll read CLAUDE.md, README.md, ELECTRON_GUIDE.md, and the skill guidance to build a concrete upgrade plan.
I’ve reviewed the current docs and now I’m inspecting the core TypeScript/Electron code to identify concrete architecture and performance bottlenecks before drafting the improvement plan.
Next I’m scanning the remaining components (TaskModal, Column, MatrixView, etc.) to find concrete hotspots causing sluggishness and identify refactor opportunities for agent-friendly structure.
I’ve identified some likely hotspots (duplicate data subscriptions, repeated full-file writes, and oversized components). I’m running lint now to add objective code-quality findings into the plan.
Final message
I have enough context to shape a concrete plan, but three preference choices will materially change sequencing and depth. I’m asking them as quick multiple-choice so I can finalize a decision-complete plan.
Plan
Agentic Upgrade Plan for FocusFlow
Summary
Modernize the repo for agentic coding with a two-track approach:
1.	replace the single stale instruction file with a structured instruction + skills system, and
2.	reduce app sluggishness via targeted performance fixes and a phased architecture refactor.
Key Changes
1.	Instruction System Restructure (Markdown-first)
•	Replace single-source CLAUDE.md usage with:
•	AGENTS.md as the canonical orchestration doc (shared rules, task routing, repo map).
•	docs/agentic/README.md as navigation.
•	docs/agentic/architecture-map.md (current architecture, boundaries, data flow).
•	docs/agentic/workflows.md (bugfix, feature, refactor, release playbooks).
•	docs/agentic/decision-log.md (ADR-style short decisions).
•	docs/agentic/checklists.md (PR/test/release/security checklists).
•	Keep CLAUDE.md, but slim it to an adapter that points to AGENTS.md to avoid drift.
•	Fix stale/incorrect docs:
•	Remove Dexie/src/db.ts references (current app uses src/services/dataService.ts + Electron IPC JSON storage).
•	Normalize broken character encoding in markdown files.
•	Align README.md and ELECTRON_GUIDE.md with real scripts/runtime behavior.
2.	New Skills (Actionable + Scripted)
•	Add repo-local skill source folder: docs/agentic/skills-src/ (versioned in repo).
•	Install/sync runnable skills into Codex skills home from this source.
•	Create these first 5 skills:
•	focusflow-repo-map: fast codebase discovery and impact mapping.
•	focusflow-data-layer: safe edits to dataService/IPC/storage format.
•	focusflow-ui-refactor: component extraction and rendering performance rules.
•	focusflow-import-export: compatibility-safe schema/import/export changes.
•	focusflow-release-check: lint/type/build/smoke workflow with triage format.
•	Each skill includes:
•	SKILL.md (tight trigger description + workflow),
•	references/ for architecture/data contracts,
•	optional scripts/ for repetitive validation tasks.
3.	Application Performance + Architecture Improvements
•	Data layer bottlenecks
•	Move Electron main-process file I/O from sync (readFileSync/writeFileSync) to async equivalents.
•	Introduce write coalescing/debouncing in renderer->IPC persistence to avoid full-dataset writes per small edit.
•	Add schema guard/validator for load/import to prevent silent corrupt state.
•	Rendering/subscription bottlenecks
•	Replace per-component broad subscriptions with selector-based hooks (board/column/task scoped).
•	Remove repeated getLabels() calls from each TaskCard; resolve labels once at board level.
•	Eliminate state-sync effects causing cascade renders (lint already flags this in BoardView and TaskModal).
•	Component architecture
•	Split TaskModal and BoardView into feature subcomponents + hooks:
•	useBoardDnD, useBoardFilters, useTaskDraft, useTaskAttachments.
•	Add domain modules (src/domain/*) for board/task/label operations so UI no longer owns business logic.
•	Functional improvements (high-value)
•	Add search/filter (title + description + labels).
•	Add undo for destructive actions (board/column/task delete).
•	Add optional autosave indicator and conflict-safe import preview.
4.	Interfaces / Type Contracts to Introduce
•	Add shared runtime schema/types module (src/domain/schema.ts) for FocusFlowData and import payloads.
•	Add explicit service interfaces:
•	IDataStore (load/save/import/export/settings)
•	IBoardService, ITaskService, ILabelService
•	Keep existing UI callsites stable initially via adapter layer in dataService.ts; migrate incrementally.
Test Plan
•	Static quality gates
•	eslint clean (including current react-hooks and react-refresh violations).
•	tsc -b clean.
•	Data integrity scenarios
•	Create/update/delete board/column/task/label; restart app; verify persistence.
•	Import legacy + current exports; verify schema normalization and no data loss.
•	Large attachment import/export round-trip.
•	Performance scenarios
•	Task checklist typing should not trigger full-file write per keystroke.
•	Board with high card count should keep drag/drop and open-modal interactions responsive.
•	Regression scenarios
•	Kanban reorder within/between columns.
•	Matrix view filtering and task opening.
•	Electron dev/prod startup and save path behavior.
Assumptions & Defaults
•	Prioritize balanced two-track delivery (docs/skills + app improvements in parallel).
•	Use actionable scripted skills over instruction-only skills.
•	Use a phased medium refactor (no full rewrite).
•	Preserve current storage format compatibility unless a migration layer is added first.
•	Keep UI behavior stable while improving internals and responsiveness.
First of all, I want the repo to be model/IDE agnostic. It no longer needs to be focussed on Claude. I also want to try out Antigravity and Codex for example. In line with this, the skills structure is different from what I am used to seeing: your-project/ ├── .agents/ (or .claude/ or .github/) │ └── skills/ │ └── [skill-name]/ # e.g., "generate-unit-tests" │ ├── SKILL.md # Mandatory instructions & metadata │ ├── scripts/ # Optional: executable scripts (Python, Node, etc.) │ │ └── run_test.py │ ├── references/ # Optional: documentation, diagrams, or examples │ │ └── api_spec.json │ └── assets/ # Optional: templates or static files └── CLAUDE.md (or AGENTS.md) # Project-wide global instructions Can you explain why you went for a different structure with the docs folder? If you also think the agnostic one is better, explain the differences. For the Application performance: I am unskilled in this domain, so I will believe your judgement. Make sure to be critical whether changes will actually help. Regarding the functional improvements, I like them, but I first want the refactor to be done. For the Interfaces / Type Contracts, can you explain in an easier way what you mean with this section? WHen it comes to the Test PlanI think it is fine. I am not as skilled here either. 
1 previous message
You’re right to push for model/IDE agnostic structure. My earlier docs/agentic/* proposal optimized for maintainability and versioned architecture docs, but it’s not the best default for cross-agent discovery.
Why I proposed docs/agentic:
•	It keeps long-form architecture/process docs separate from runtime-triggered skill files.
•	It reduces clutter in repo root.
•	It’s good for humans, but less “auto-discoverable” for agent tooling that expects .agents/skills/*.
Why your .agents/skills/* shape is better for your goal:
•	It matches emerging cross-agent conventions (Antigravity, Codex, Claude-like systems).
•	It colocates trigger metadata (SKILL.md) with resources/scripts for direct execution.
•	It makes onboarding deterministic: “look in .agents/skills first.”
•	It avoids vendor lock-in naming (.claude etc.).
So yes: for your objective, I recommend switching to:
•	.agents/skills/<skill-name>/...
•	AGENTS.md as canonical global instructions
•	keep CLAUDE.md only as a tiny compatibility shim (optional, but pragmatic)
Simple explanation of “Interfaces / Type Contracts”:
•	Right now many files pass around plain JS objects without one enforced runtime shape.
•	“Type contracts” means: define one clear data shape for boards/tasks/settings and validate data at boundaries (load/import/IPC).
•	“Interfaces” means: define clear responsibilities like:
•	storage layer: read/write/import/export files
•	task/board logic layer: reorder, delete cascades, validation
•	UI layer: render only, call services
•	Benefit: fewer hidden bugs, easier refactors, and agents can safely edit one layer without breaking others.
On performance and refactor-first:
•	Agreed. I’ll keep functional additions out of phase 1.
•	Phase 1 will only include changes with measurable benefit (render count reduction, fewer disk writes, lower interaction latency).
I need one structural choice to finalize the replacement plan.
Final message
Perfect. We’ll lock this in:
•	Model-agnostic standard: .agents/skills/<skill>/...
•	Global instructions: AGENTS.md as source of truth
•	Compatibility: tiny CLAUDE.md shim pointing to AGENTS.md
I’ll update the plan accordingly with:
1.	Repo structure migration to .agents/skills.
2.	Refactor-first app work (no new features in phase 1).
3.	Clear, simple service boundaries (storage vs business logic vs UI) with runtime data validation.
4.	Performance changes only if measurable (render count, write frequency, UI latency).
Can you change the plan and regenarate it with the new changes? 
Plan
FocusFlow Agentic Refactor Plan (Model/IDE Agnostic)
Summary
Refactor FocusFlow in two phases with refactor-first priority and a model-agnostic agent setup.
Phase 1 focuses only on architecture + performance + reliability.
Phase 2 (optional) adds new functionality after stability/performance targets are met.
Key Changes
1.	Adopt model-agnostic agent structure
•	Add canonical global instructions in AGENTS.md.
•	Keep CLAUDE.md as a minimal compatibility shim that points to AGENTS.md.
•	Introduce .agents/skills/ as the standard skills root:
•	.agents/skills/<skill>/SKILL.md
•	optional scripts/, references/, assets/
•	Create initial skills:
•	repo-map (fast codebase orientation)
•	data-layer (safe storage/IPC changes)
•	ui-refactor (component splitting + render hygiene)
•	import-export (compat-safe backup/migration handling)
•	release-check (lint/type/build/smoke checks)
2.	Docs cleanup and de-staling
•	Update README.md, ELECTRON_GUIDE.md, and AGENTS.md to match actual implementation.
•	Remove stale Dexie/src/db.ts guidance and replace with current Electron JSON storage flow.
•	Normalize markdown encoding issues and simplify duplicated instructions.
3.	Phase 1 app refactor (no new features)
•	Storage layer
•	Move Electron file operations from sync I/O to async I/O.
•	Add save coalescing/debouncing to reduce full-data writes during rapid edits.
•	Add runtime validation at load/import boundaries.
•	Service boundaries (simple contract model)
•	Storage service: read/write/import/export/settings only.
•	Domain services: board/task/label rules (ordering, cascading deletes, transforms).
•	UI: rendering + user interactions only, no business logic.
•	React/render performance
•	Replace broad subscription patterns with scoped selectors.
•	Remove repeated label fetches per TaskCard; resolve labels once at board scope.
•	Refactor state-sync effects that cause cascading renders (current lint failures).
•	Component decomposition
•	Split large components (BoardView, TaskModal) into focused hooks/components.
•	Preserve current behavior while reducing coupling and re-render pressure.
4.	Phase 2 (deferred until Phase 1 passes targets)
•	Search/filter, undo for destructive actions, import preview/autosave UX.
•	Only start when Phase 1 performance + regression criteria are green.
Public Interfaces / Type Contracts (plain-language)
•	Define one shared “data shape” for app data/settings.
•	Validate incoming data at app boundaries (file load/import/IPC).
•	Keep strict separation:
•	storage API = persistence only
•	domain API = app rules only
•	UI API = display + events only
•	Result: safer edits, easier debugging, less breakage when swapping models/agents.
Test Plan
1.	Quality gates
•	eslint clean (including current hook/perf rule violations).
•	tsc -b clean.
2.	Regression checks
•	Create/edit/delete board/column/task/label.
•	Drag/drop reorder within and across columns.
•	Matrix filtering + task modal open/edit flows.
•	Import/export round-trip with attachments.
3.	Performance checks (must be measured)
•	Track save frequency before/after debouncing.
•	Track render counts in board/task-heavy views before/after refactor.
•	Verify interaction latency improvements for typing, drag/drop, and modal operations.
Assumptions and Defaults
•	Canonical global instructions: AGENTS.md.
•	CLAUDE.md retained only as compatibility shim.
•	Skills standard: .agents/skills/* for model/IDE agnostic operation.
•	Phase 1 is strictly refactor/performance/reliability; no new user-facing features.
•	Changes are accepted only when they demonstrate measurable benefit or reduced risk.
I do want to start with the implementation but I do not know the best way to proceed. What do you suggest about proceeding with the plan? 
Best path is to execute in small vertical PRs with hard checkpoints.
1.	PR 1: Agentic foundation (lowest risk, high leverage)
•	Add AGENTS.md (canonical)
•	Convert CLAUDE.md to shim
•	Create .agents/skills/ skeleton + 2 starter skills: repo-map, release-check
•	Update README.md pointers
•	Exit criteria: docs are consistent, no app behavior changes
2.	PR 2: Refactor guardrails
•	Add shared data schema/types and boundary validation (load/import)
•	Define storage/domain/UI service boundaries (adapters, no behavior change)
•	Exit criteria: same behavior, stricter data safety, lint/typecheck clean
3.	PR 3: Performance pass 1 (measurable only)
•	Async Electron file I/O
•	Save debouncing/coalescing
•	Remove obvious over-subscription patterns (TaskCard labels, broad refreshes)
•	Exit criteria: fewer writes and fewer renders in measured scenarios
4.	PR 4: Component decomposition
•	Split BoardView and TaskModal into focused hooks/components
•	Resolve current hook-related lint issues while preserving UX
•	Exit criteria: cleaner architecture, no regressions in drag/drop/modal flows
5.	PR 5: Deferred features (only after green stability/perf)
•	Search/filter, undo, import preview
If you want, next step is: I can break PR 1 into a concrete task checklist (files to touch + acceptance tests) so implementation can start immediately.

Yes please do 
PR 1 Task Checklist: Agentic Foundation
Goal
Set up model/IDE-agnostic agent instructions and skill scaffolding without changing app behavior.
Files to change
1.	Create AGENTS.md
2.	Replace CLAUDE.md with compatibility shim
3.	Update README.md with “Agent Instructions” section
4.	Create $.agents/skills/repo-map/SKILL.md
5.	Create $.agents/skills/release-check/SKILL.md
6.	Create optional references:
•	.agents/skills/repo-map/references/repo-layout.md
•	.agents/skills/release-check/references/checklist.md
Content checklist
1.	AGENTS.md
•	Define canonical instruction source.
•	Define repo map (renderer, electron main/preload, services).
•	Define allowed workflow: inspect -> plan -> small PR -> verify.
•	Define rule: no vendor-specific assumptions; works for Codex/Antigravity/Claude.
•	Define required verification for each change (lint, build, focused manual smoke test).
2.	CLAUDE.md shim
•	Keep very short.
•	State: “Canonical instructions moved to AGENTS.md; follow that file.”
•	No duplicate full instruction text.
3.	README.md
•	Add short section:
•	Where global agent instructions live (AGENTS.md)
•	Where reusable skills live (.agents/skills/)
•	How to add a new skill folder (SKILL.md + optional scripts/references/assets)
4.	repo-map skill
•	Trigger: when user asks where code lives, where to edit, impact analysis.
•	Workflow: scan entrypoints, data flow, likely touch points, risk points.
•	Output format: “paths to inspect”, “likely breakpoints”, “verification steps”.
5.	release-check skill
•	Trigger: before commit/PR or “review this change”.
•	Workflow: run lint/build, summarize failures, propose minimal fix order.
•	Output format: “blocking issues”, “warnings”, “ready/not ready”.
Acceptance criteria
1.	No behavior changes in app UI or storage.
2.	New structure exists under .agents/skills/.
3.	AGENTS.md is complete and vendor-agnostic.
4.	CLAUDE.md is shim-only.
5.	README.md points to new canonical locations.
6.	cmd /c npm run lint still runs (existing lint failures may remain, but no new ones from PR 1 docs/files).
7.	cmd /c npm run build succeeds.
PR title and scope
1.	Title: chore(agentic): add AGENTS.md and model-agnostic .agents/skills foundation
2.	Scope rule: docs + skill scaffolding only, no TypeScript/Electron logic edits.
Does the update of ELECTRON_GUIDE.md need to be added here or is that a later PR? 
Later PR.
Keep PR 1 strictly scoped to agentic foundation (AGENTS.md, shim, .agents/skills, README.md).
Update ELECTRON_GUIDE.md in PR 2 with the broader docs de-staling, so PR 1 stays low-risk and easy to review.
Great than now please implement it! 
Plan
PR 1 Implementation Spec (Ready to Execute)
Summary
Implement the agentic foundation in a single low-risk PR with docs + skill scaffolding only. No app code changes.
Exact File Actions
1.	Create /C:/Users/RamonvanSchalm/prive_projecten/FocusFlow/AGENTS.md
•	Canonical instruction source.
•	Vendor-neutral wording (Codex, Antigravity, Claude, others).
•	Repo map:
•	src/ renderer UI
•	src/services/dataService.ts renderer data layer
•	electron/main.ts + electron/preload.ts desktop bridge/storage
•	Standard workflow:
•	inspect context
•	propose minimal change
•	run checks
•	summarize risks + verification
•	Required checks per change: cmd /c npm run lint, cmd /c npm run build, focused smoke test.
2.	Replace contents /C:/Users/RamonvanSchalm/prive_projecten/FocusFlow/CLAUDE.md
•	Keep only compatibility shim text:
•	canonical instructions moved to AGENTS.md
•	follow AGENTS.md for all tasks
•	file kept for backwards compatibility
3.	Update /C:/Users/RamonvanSchalm/prive_projecten/FocusFlow/README.md
•	Add “Agent Instructions” section with:
•	global instructions path: AGENTS.md
•	skills path: .agents/skills/
•	skill folder contract (SKILL.md + optional scripts/, references/, assets/)
•	Keep existing product/dev sections unchanged.
4.	Create /C:/Users/RamonvanSchalm/prive_projecten/FocusFlow/.agents/skills/repo-map/SKILL.md
•	Frontmatter:
•	name: repo-map
•	description includes trigger conditions (repo orientation, impact analysis).
•	Body:
•	quick scan procedure
•	output template: touched paths, risk points, validation steps.
•	Optional reference file:
•	/C:/Users/RamonvanSchalm/prive_projecten/FocusFlow/.agents/skills/repo-map/references/repo-layout.md
5.	Create /C:/Users/RamonvanSchalm/prive_projecten/FocusFlow/.agents/skills/release-check/SKILL.md
•	Frontmatter:
•	name: release-check
•	description includes trigger conditions (pre-commit/pre-PR/review).
•	Body:
•	run lint/build
•	classify blockers vs warnings
•	output template: readiness verdict + next fixes.
•	Optional reference file:
•	/C:/Users/RamonvanSchalm/prive_projecten/FocusFlow/.agents/skills/release-check/references/checklist.md
Validation
1.	Ensure only docs/skill files changed.
2.	Run:
•	cmd /c npm run lint
•	cmd /c npm run build
3.	Confirm no TypeScript/Electron source files were modified.
Assumptions
•	ELECTRON_GUIDE.md stays untouched in PR 1.
•	Existing lint issues are acceptable as baseline; PR 1 must not introduce new code-level issues.
Implement plan
5 previous messages
I’m implementing PR 1 now using the skill-creator workflow because this task includes creating and structuring new skills. I’ll add the new agentic files, keep app code untouched, then run lint/build validation.
I hit an apply_patch tool failure, so I’m switching to direct file writes for this multi-file docs scaffold and then validating with git status/lint/build.
I’ve updated the top-level docs; next I’m creating the .agents/skills scaffolding with repo-map and release-check plus reference files.
I’ve finished the file scaffolding and will now run git status, then lint and build to verify the PR-1 acceptance criteria.
Build succeeded outside the sandbox. I’ll do a final status check now to confirm exactly what changed and call out any generated artifacts from running build.
Final message
Implemented. PR 1 scope is now in place with docs + skill scaffolding only.
Changed files
•	AGENTS.md
•	CLAUDE.md (compatibility shim)
•	README.md (added Agent Instructions section)
•	$.agents/skills/repo-map/SKILL.md
•	.agents/skills/repo-map/references/repo-layout.md
•	$.agents/skills/release-check/SKILL.md
•	.agents/skills/release-check/references/checklist.md
Validation results
•	cmd /c npm run lint: fails due pre-existing baseline issues in app code (BoardView.tsx, TaskModal.tsx, ConfirmDialog.tsx, useData.ts). No new lint issues from this docs-only change.
•	cmd /c npm run build: succeeded (ran outside sandbox due sandbox EPERM spawn limitation).
•	git status --short: only expected docs/skills files changed.
•	ELECTRON_GUIDE.md: untouched.
If you want, I can now prepare the exact commit message and proceed to PR 2 planning/execution.
Model changed from GPT-5.4 to GPT-5.2-Codex.
Please read back what has been discussed in this chat. I have already commited the changes. Can you continue with PR 2?
Worked for 51s
Recap of this chat
You asked to make the repo model/IDE agnostic and replace the Claude centric setup with a .agents/skills structure. We agreed on AGENTS.md as canonical, CLAUDE.md as a minimal shim, and .agents/skills/* as the standard skills root. I implemented PR 1 (agentic foundation), ran validation, and you committed it. Now you want to continue with PR 2.
Below is the PR 2 plan (docs de staling + Electron guide update), using your confirmed preferences: desktop first docs, update README storage stack, and full update of ELECTRON_GUIDE.md.
If you want, I can proceed to implement PR 2 in a single change set.
Plan
PR 2: Docs De Staling and Electron Guide Alignment
Summary
Update documentation to match the current Electron JSON storage architecture, remove stale Dexie/IndexedDB references, and fix encoding artifacts. No app logic changes.
Key Changes
•	README: update storage description and tech stack to reflect Electron JSON + IPC and browser dev fallback, remove Dexie mention, and align “local-first” language with desktop-first reality.
•	ELECTRON_GUIDE: fully align data storage, import/export, and legacy notes with current JSON-based persistence; fix encoding artifacts in tree diagrams and text.
•	Optional: Add a short “Web dev fallback” note in README and ELECTRON_GUIDE to describe localStorage behavior when not running Electron.
Implementation Details
•	README updates:
•	Replace “IndexedDB/Dexie” with “Electron JSON file storage via IPC; localStorage fallback for browser dev.”
•	Keep features list intact; adjust “Local First Architecture” phrasing to avoid “browser” claims.
•	Keep “Agent Instructions” section as is.
•	Fix heading capitalization (“Getting Started”).
•	ELECTRON_GUIDE updates:
•	Update “Data Storage” section to describe JSON storage location + settings file.
•	Remove/adjust “Legacy IndexedDB” references; keep legacy import note only if code actually handles it (dataService does).
•	Update Import/Export section to note Base64 attachments and JSON structure.
•	Fix box drawing/arrow encoding artifacts in code blocks.
•	Keep scripts table accurate with npm run electron:* entries already present.
•	Ensure wording is desktop first, with explicit fallback note for browser dev.
Public Interfaces / Types
•	No public API or type changes. Documentation only.
Test Plan
•	None required (docs only), but verify in text that references match:
•	src/services/dataService.ts (JSON storage and import/export behavior)
•	electron/main.ts + electron/preload.ts (IPC file persistence)
Assumptions
•	Electron JSON file storage is the authoritative runtime path.
•	Browser localStorage is a dev fallback only.
Implement plan
Can you write a large plan describing everything that was discussed in this chat and include all PR's in detail? 
Plan
FocusFlow Agentic + Architecture Improvement Plan (All PRs)
Summary
Convert the repo to a model/IDE agnostic agent workflow, de stale documentation to match the current Electron JSON storage, then perform a phased architecture refactor focused on performance and reliability before adding any new features. This plan enumerates all PRs discussed in this chat, including already completed PR 1, and the requested PR 2 and beyond.
PR 1 — Agentic Foundation (Completed)
Goal: Make the repo model/IDE agnostic and establish a skills system.
Changes
•	Add canonical global instructions in AGENTS.md (model/IDE agnostic).
•	Replace CLAUDE.md with a compatibility shim pointing to AGENTS.md.
•	Add .agents/skills/ scaffold with:
•	repo-map skill (SKILL.md + references)
•	release-check skill (SKILL.md + references)
•	Update README.md with “Agent Instructions” section and .agents/skills structure.
Acceptance
•	No app behavior changes.
•	Only docs/skills files modified.
•	lint/build run (existing lint failures accepted as baseline).
PR 2 — Docs De Staling and Electron Guide Alignment
Goal: Align docs with actual Electron JSON storage and remove stale Dexie/IndexedDB references.
Changes
•	README.md
•	Update “Local First Architecture” wording to desktop first language.
•	Replace Dexie/IndexedDB mention with “Electron JSON file storage via IPC; localStorage fallback for browser dev.”
•	Fix heading “Getting Started”.
•	Update Development section to reference src/services/dataService.ts (not src/db.ts).
•	ELECTRON_GUIDE.md
•	Update Data Storage section to describe JSON files and settings file.
•	Update Import/Export section to note Base64 attachments and JSON structure.
•	Keep legacy import note only as supported by dataService.
•	Fix encoding artifacts in tree diagrams/arrow characters.
•	Add short browser dev fallback note (localStorage when not running Electron).
Acceptance
•	Docs reflect current implementation of src/services/dataService.ts, electron/main.ts, electron/preload.ts.
•	No code changes.
PR 3 — Service Boundary and Data Contract Baseline (Refactor First)
Goal: Establish clean boundaries and a single data contract to reduce hidden coupling and future refactor risk.
Changes
•	Create a shared data contract module (e.g., src/domain/schema.ts) containing FocusFlowData, FocusFlowSettings, and import payload shapes.
•	Introduce a storage interface (e.g., IDataStore) that defines load/save/import/export/settings behavior.
•	Keep dataService.ts as an adapter that conforms to the contract without changing behavior.
•	Add minimal runtime validation at load/import boundaries to prevent corrupt data from entering the app.
Acceptance
•	No user visible behavior changes.
•	Existing import/export remains compatible.
•	Code compiles; lint unchanged or improved.
PR 4 — Performance Pass 1 (Measurable Gains Only)
Goal: Reduce sluggishness through concrete, measurable improvements without functional changes.
Changes
•	Electron main process: switch file I/O to async.
•	Debounce/coalesce persistence writes to avoid full dataset writes on rapid edits.
•	Reduce over subscription:
•	Eliminate repeated getLabels() per TaskCard.
•	Scope data subscriptions to board/column/task as appropriate.
•	Remove state sync effects that trigger cascading renders (fix existing lint errors in BoardView and TaskModal).
Acceptance
•	Persist frequency reduced in typical edit flows.
•	Render counts reduced in board/task views.
•	Lint errors in the identified files resolved.
PR 5 — Component Decomposition (Maintain Behavior)
Goal: Improve maintainability by splitting large components into focused units.
Changes
•	Extract focused hooks/components from BoardView and TaskModal:
•	useBoardDnD, useBoardFilters
•	useTaskDraft, useTaskAttachments
•	Keep UI behavior identical.
Acceptance
•	No regression in drag/drop, modal editing, or matrix view.
•	Reduced component size and improved testability.
PR 6 — Feature Additions (After Refactor Success)
Goal: Introduce new functionality only after refactor and performance baselines are stable.
Potential features
•	Search/filter (title/description/labels).
•	Undo for destructive actions.
•	Import preview/autosave indicator.
Acceptance
•	No performance regressions vs PR 4 baseline.
Test Plan (Across PRs)
•	Lint and build for each PR.
•	Manual smoke tests:
•	Create/edit/delete boards, columns, tasks, labels.
•	Drag/drop within and across columns.
•	Matrix view filter + task open/edit.
•	Import/export round trip with attachments.
•	Performance spot checks:
•	Render count reduction after PR 4.
•	Persistence frequency reduction after debouncing.
Assumptions
•	Desktop Electron JSON storage is authoritative runtime path.
•	Browser localStorage is dev fallback only.
•	Refactor first; features deferred until after stability/perf improvements.

