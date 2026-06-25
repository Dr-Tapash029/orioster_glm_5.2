%% Orioster – Ai Powered hms — Blueprint Master Contract
%% File: agents.md
%% Version: 3.0
%% Status: PROTECTED MASTER CONTRACT
%%
%% PURPOSE
%% This file is the mandatory entry point for every Orioster AI-assisted
%% development session. It prevents model drift, visual regression, broken code
%% generation, and context collapse by forcing Hermes Agent to read the 9 context
%% files in the exact sequence below before planning, editing, generating, or
%% reviewing code.
%%
%% HARD RULE
%% No implementation, refactor, review, UI change, backend wiring, test creation,
%% CLI initialization, or file rewrite may begin until the mandatory read sequence
%% has been completed.
%%
%% ---------------------------------------------------------------------------
%% PROTECTED FILE RULES
%% ---------------------------------------------------------------------------
%%
%% 1. agents.md is protected and must not be overwritten.
%% 2. Before running Supabase CLI, PowerSync CLI, Flutter project init, or any
%%    third-party platform initializer, back up agents.md.
%% 3. After external initialization, compare and merge manually.
%% 4. Do not allow platform scripts to replace agents.md.
%% 5. overview.md, architecture.mmd, and library_docs.md are protected
%%    source-of-truth context files unless the engineer explicitly asks to revise
%%    protected context.
%%
%% ---------------------------------------------------------------------------
%% MANDATORY READ SEQUENCE
%% ---------------------------------------------------------------------------
%%
%% Hermes Agent must read these files in this order:
%%
%% 1. overview.md
%%    Product scope, target users, in-scope and out-of-scope boundaries.
%%
%% 2. architecture.mmd
%%    System boundaries, offline-first flow, local authority, privacy rules,
%%    AI safety rules, and data-flow constraints.
%%
%% 3. folder_structure.md
%%    Approved Flutter, Dart, backend, Supabase, PowerSync, test, and tooling
%%    file layout.
%%
%% 4. code_standards.md
%%    Dart, Flutter, Riverpod 3.0, GoRouter, privacy, error handling, testing,
%%    and production code standards.
%%
%% 5. library_docs.md
%%    Exact implementation contracts for PowerSync, Supabase, OpenRouter,
%%    SQLCipher, Dart Cryptography, and related integration boundaries.
%%
%% 6. ui_tokens.md
%%    Visual tokens: colors, typography, spacing, radius, blur, motion,
%%    accessibility, and component primitives.
%%
%% 7. ui_rules.mmd
%%    UI behavior rules, wizard constraints, offline UI behavior, AI disclaimer
%%    behavior, and 60 FPS constraints.
%%
%% 8. ui_registry.md
%%    Living registry of approved custom widgets. Must be checked before
%%    creating new UI.
%%
%% 9. progress_tracker.md
%%    Current project state, phase progress, review logs, imprint logs,
%%    recover logs, and next-session continuity.
%%
%% ---------------------------------------------------------------------------
%% HERMES AGENT SKILL ROSTER
%% ---------------------------------------------------------------------------
%%
%% Hermes Agent has the following skills and must apply them according to task:
%%
%% - flutter-app-architecture
%% - powersync-manager
%% - riverpod-3-0-strategist
%% - supabase-expert
%% - ui-ux-pro-max
%% - claude-code
%% - claude-design
%% - test-driven-development
%% - powersync-supabase-integration
%% - frontend-animation-best-practices
%% - flutter-dev
%% - code-workflow
%% - Flutter
%% - supabase
%% - agent-orchestrator
%% - subagent-driven-development
%% - kanban-orchestrator
%% - kanban-worker
%%
%% Hermes skills are an execution overlay. They do not override Orioster’s
%% architecture, privacy, offline-first, AI-safety, or UI-governance rules.
%%
%% ---------------------------------------------------------------------------
%% SKILL ROUTING
%% ---------------------------------------------------------------------------
%%
%% Planning / Architecture:
%% agent-orchestrator, subagent-driven-development, flutter-app-architecture,
%% riverpod-3-0-strategist, powersync-manager, powersync-supabase-integration,
%% supabase-expert, supabase, ui-ux-pro-max
%%
%% Flutter UI:
%% ui-ux-pro-max, claude-design, frontend-animation-best-practices,
%% flutter-dev, Flutter, riverpod-3-0-strategist
%%
%% Riverpod State:
%% riverpod-3-0-strategist, flutter-dev, code-workflow
%%
%% Backend / Sync:
%% powersync-manager, powersync-supabase-integration, supabase-expert, supabase,
%% code-workflow, test-driven-development
%%
%% AI Services:
%% agent-orchestrator, claude-code, code-workflow, test-driven-development,
%% riverpod-3-0-strategist
%%
%% Testing:
%% test-driven-development, code-workflow, flutter-dev, Flutter
%%
%% Kanban / Progress:
%% kanban-orchestrator, kanban-worker, subagent-driven-development
%%
%% Recovery:
%% agent-orchestrator, claude-code, code-workflow, powersync-manager,
%% powersync-supabase-integration
%%
%% ---------------------------------------------------------------------------
%% ORIOSTER CORE NON-NEGOTIABLES
%% ---------------------------------------------------------------------------
%%
%% 1. Local SQLite through PowerSync is the primary runtime authority.
%% 2. The app must work offline for all core clinical workflows.
%% 3. Network must never block Patient Entry.
%% 4. AI must never block UI.
%% 5. AI is advisory only and never final clinical authority.
%% 6. Raw PHI must never be sent to AI.
%% 7. AI is disabled until Step 8 creates patient_summary_v1.
%% 8. Step 8 Local Summary is fully local: no AI, no network.
%% 9. Clinical summaries must be encrypted before sync.
%% 10. Supabase RLS protects cloud access.
%% 11. PowerSync sync rules must partition data by role and assignment.
%% 12. All failures must degrade gracefully.
%%
%% ---------------------------------------------------------------------------
%% COMMAND CONTRACTS
%% ---------------------------------------------------------------------------
%%
%% /architect
%% Use before complex features, architecture work, backend integration,
%% Patient Entry steps, AI modules, or major UI systems.
%%
%% Required behavior:
%% - Read all 9 context files first.
%% - Identify relevant constraints.
%% - Ask targeted questions one at a time if needed.
%% - Produce a multi-step blueprint.
%% - Include files to touch, tests to add, risks, and verification steps.
%% - Do not write code until the engineer confirms the blueprint.
%%
%% /review
%% Use immediately after a feature or important code change.
%%
%% Required behavior:
%% - Validate against architecture.mmd, code_standards.md, library_docs.md,
%%   ui_tokens.md, ui_rules.mmd, and folder_structure.md.
%% - Classify findings as Critical, Important, or Minor.
%% - Auto-fix is disabled unless the engineer explicitly approves fixes.
%%
%% /imprint
%% Use after any Flutter UI build or UI update.
%%
%% Required behavior:
%% - Compare UI against ui_tokens.md and ui_rules.mmd.
%% - Check dark-mode contrast, spacing, radius, blur, motion, FAB behavior,
%%   AI disclaimer behavior, and offline-state behavior.
%% - Update ui_registry.md.
%% - Add or update widget/golden test tracking.
%%
%% /recover
%% Use when builds fail, sync loops, state loops, tests break, or the agent
%% begins broad rewrites.
%%
%% Required behavior:
%% - Stop broad code generation.
%% - Identify one exact failure profile.
%% - Produce one targeted fix.
%% - Avoid multi-file rewrite spirals.
%% - Verify with analyzer, tests, or build as appropriate.
%%
%% /remember
%% Use for session continuity.
%%
%% Required behavior:
%% - /remember save: update memory.md and progress_tracker.md.
%% - /remember restore: hydrate project state before new work.
%% - Preserve phase, current task, files changed, tests added, blockers,
%%   risks, and next action.
%%
%% ---------------------------------------------------------------------------
%% TOKEN AND DRIFT CONTROL
%% ---------------------------------------------------------------------------
%%
%% To reduce token consumption and prevent broken generations:
%%
%% 1. Never re-infer project architecture from memory alone.
%% 2. Always hydrate from the 9 context files.
%% 3. Prefer surgical edits over broad rewrites.
%% 4. Check ui_registry.md before creating widgets.
%% 5. Check folder_structure.md before creating files.
%% 6. Check progress_tracker.md before deciding what is next.
%% 7. Use memory.md only as a session snapshot, never as source of truth.
%% 8. If context conflicts, follow this priority:
%%    a. System/developer safety instructions
%%    b. agents.md
%%    c. architecture.mmd
%%    d. library_docs.md
%%    e. overview.md
%%    f. code_standards.md
%%    g. folder_structure.md
%%    h. ui_tokens.md
%%    i. ui_rules.mmd
%%    j. ui_registry.md
%%    k. progress_tracker.md
%%    l. current user instruction, if it does not violate hard constraints
%%
%% ---------------------------------------------------------------------------
%% FILE CREATION GATE
%% ---------------------------------------------------------------------------
%%
%% Before creating or editing any file, Hermes Agent must verify:
%%
%% - The file belongs to the approved folder structure.
%% - The change does not duplicate an existing widget, service, repository,
%%   controller, or model.
%% - The change preserves offline-first behavior.
%% - The change does not send raw PHI to AI.
%% - Riverpod 3.0 is used for state.
%% - GoRouter is used for navigation.
%% - Supabase calls are not placed directly in widgets.
%% - OpenRouter calls are not placed directly in widgets.
%% - Runtime reads prefer local PowerSync SQLite.
%% - Tests are added or explicitly tracked.
%% - UI changes are reflected in ui_registry.md.
%% - Progress is reflected in progress_tracker.md.
%%
%% ---------------------------------------------------------------------------
%% EXTERNAL CLI SAFETY GATE
%% ---------------------------------------------------------------------------
%%
%% Before running Supabase, PowerSync, Flutter project init, or other external
%% initializer commands:
%%
%% 1. Back up agents.md.
%% 2. Back up mutable context files if the tool may modify the repository root.
%% 3. Run the external command.
%% 4. Diff generated files.
%% 5. Restore or manually merge agents.md.
%% 6. Confirm the mandatory read sequence still exists.
%% 7. Update progress_tracker.md.
%%
%% ---------------------------------------------------------------------------
%% PATIENT ENTRY SPECIAL GATE
%% ---------------------------------------------------------------------------
%%
%% Patient Entry is a critical workflow.
%%
%% Required:
%% - FAB is always visible where role allows patient creation.
%% - Wizard opens in one tap.
%% - Steps cannot be skipped.
%% - Every field autosaves locally.
%% - Step 8 creates patient_summary_v1 locally.
%% - No AI before Step 8.
%% - Step 9 notification is idempotent and queue-backed.
%% - Step 10 requires role checklist validation.
%% - Final submit saves locally and queues sync.
%%
%% ---------------------------------------------------------------------------
%% AI SAFETY GATE
%% ---------------------------------------------------------------------------
%%
%% AI can receive only patient_summary_v1 after Step 8.
%%
%% AI must never receive:
%% - names
%% - phone numbers
%% - IDs
%% - addresses
%% - raw clinical notes
%% - raw lab reports
%% - raw images
%% - attachments
%% - uncapped free text
%% - any PHI before Step 8
%%
%% Every AI output must:
%% - be advisory
%% - use strict JSON schema
%% - include risk_level
%% - include confidence
%% - include limitations
%% - include recommendation_type = advisory
%% - include the mandatory disclaimer:
%%   "This output is not a diagnosis and must be reviewed by a human professional."
%%
%% ---------------------------------------------------------------------------
%% UI GOVERNANCE GATE
%% ---------------------------------------------------------------------------
%%
%% Before UI work:
%% - Read ui_tokens.md.
%% - Read ui_rules.mmd.
%% - Check ui_registry.md.
%%
%% After UI work:
%% - Run /imprint.
%% - Update ui_registry.md.
%% - Add widget/golden tests or track them.
%%
%% UI must:
%% - use glassmorphism tokens
%% - avoid hardcoded colors/spacing/radius/typography
%% - preserve 60 FPS target
%% - show offline state non-intrusively
%% - avoid full-screen blocking loaders
%% - keep FAB visible where required
%% - show AI disclaimer chip for AI output
%%
%% ---------------------------------------------------------------------------
%% HERMES EXECUTION FLOW
%% ---------------------------------------------------------------------------

flowchart TD

  Start(["Session Start"]) --> LoadAgents["Read agents.md first"]

  LoadAgents --> Read1["1. Read overview.md"]
  Read1 --> Read2["2. Read architecture.mmd"]
  Read2 --> Read3["3. Read folder_structure.md"]
  Read3 --> Read4["4. Read code_standards.md"]
  Read4 --> Read5["5. Read library_docs.md"]
  Read5 --> Read6["6. Read ui_tokens.md"]
  Read6 --> Read7["7. Read ui_rules.mmd"]
  Read7 --> Read8["8. Read ui_registry.md"]
  Read8 --> Read9["9. Read progress_tracker.md"]

  Read9 --> Hydrate["Hydrate session context"]
  Hydrate --> CheckMemory{"memory.md exists and restore requested?"}
  CheckMemory -->|Yes| Restore["Run /remember restore"]
  CheckMemory -->|No| Continue["Continue with hydrated context"]
  Restore --> Continue

  Continue --> RequestType{"User request type?"}

  RequestType -->|Complex feature or architecture| Architect["Run /architect"]
  RequestType -->|Code implementation| CodeGate["Check architecture, folder, standards, tests"]
  RequestType -->|Flutter UI| ImprintPreGate["Check tokens, rules, registry"]
  RequestType -->|Backend or sync| BackendGate["Check library docs and CLI safety"]
  RequestType -->|Review| Review["Run /review"]
  RequestType -->|Failure| Recover["Run /recover"]
  RequestType -->|Session end| RememberSave["Run /remember save"]

  Architect --> Blueprint["Produce blueprint and wait for engineer confirmation"]
  Blueprint --> Confirmed{"Engineer confirmed?"}
  Confirmed -->|No| AskTargeted["Ask one targeted question or revise blueprint"]
  AskTargeted --> Blueprint
  Confirmed -->|Yes| CodeGate

  CodeGate --> FileGate{"File allowed by folder_structure.md?"}
  FileGate -->|No| BlockFile["BLOCK: choose approved location"]
  FileGate -->|Yes| PrivacyGate{"Privacy and offline rules preserved?"}

  PrivacyGate -->|No| BlockPrivacy["BLOCK: revise design"]
  PrivacyGate -->|Yes| TestGate["Plan or add tests"]

  TestGate --> Implement["Implement surgical change"]
  Implement --> Review

  ImprintPreGate --> RegistryGate{"Widget already exists?"}
  RegistryGate -->|Yes| ReuseWidget["Reuse or extend existing widget"]
  RegistryGate -->|No| BuildWidget["Create approved widget"]
  ReuseWidget --> UIReview["Run /imprint after UI change"]
  BuildWidget --> UIReview
  UIReview --> Review

  BackendGate --> CliNeeded{"External CLI needed?"}
  CliNeeded -->|Yes| BackupAgents["Back up agents.md before CLI"]
  BackupAgents --> RunCli["Run CLI/init command"]
  RunCli --> MergeAgents["Diff and restore/merge agents.md"]
  MergeAgents --> BackendImplement["Implement backend/sync change"]
  CliNeeded -->|No| BackendImplement
  BackendImplement --> Review

  Review --> Findings{"Findings?"}
  Findings -->|Critical| StopCritical["Stop and ask engineer before fixes"]
  Findings -->|Important or Minor| TrackIssues["Track issues in progress_tracker.md"]
  Findings -->|None| Verify["Run analyzer, tests, or build as appropriate"]

  Verify --> UpdateProgress["Update progress_tracker.md"]
  UpdateProgress --> RememberDecision{"End of session?"}
  RememberDecision -->|Yes| RememberSave
  RememberDecision -->|No| Done["Task ready for next instruction"]

  Recover --> OneFix["Produce one targeted fix only"]
  OneFix --> Verify

  RememberSave --> MemoryUpdate["Update memory.md and progress_tracker.md"]
  MemoryUpdate --> SessionEnd(["Session End"])

  BlockFile --> Architect
  BlockPrivacy --> Architect
  StopCritical --> Architect
