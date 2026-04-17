# Test Scaffolding (Migration)

This directory tracks the domain-focused test plan introduced during the V2 migration.

## Targeted Domains

- `core/workspace/services`
  - `workspaceTreeService`
  - `workspaceTabsService`
  - `workspacePathService`
  - `workspaceEffectsService` / sync bridges
- `core/terminal/store/terminalStore`
- command handlers in `core/commands/handlers/registerDefaultCommands.ts`
- `features/local-runtime`
  - `store/runtimeModeStore`
  - `store/localRuntimeStore`
  - `services/runtimeSessionService`
  - `services/localPreviewBridge`
- `features/source-control`
  - `services/sourceControlService`
  - `store/sourceControlStore`

## Planned Test Strategy

1. Introduce `vitest` + `@vitest/ui` in a dedicated follow-up phase.
2. Add fast unit tests for pure services (tree/path/tabs).
3. Add store-level integration tests for terminal session lifecycle.
4. Add command handler tests using mocked Zustand store states.
5. Add parser tests for `git status --porcelain` conversion and entry badges (`M`, `A`, `U`).
6. Add runtime-mode tests for consent/activation/disconnect + process cleanup selections.
7. Add local-preview bridge tests for localhost URL extraction from terminal chunks.

## Priority Regression Cases

- Deleting/moving nested folders should keep tree and tabs coherent.
- `getPathForId` and `getFileByPath` parity after refactors.
- Terminal session add/remove/ensure behavior with panel commands.
- Explorer context command payload handling (`rename`, `delete`, `openInTerminal`).
- Runtime activation gate: local commands must request consent when mode is `online`.
- Disconnect cleanup choice should call expected process-control action (`keep`, `kill-current`, `kill-all`).
- Git status parser must keep staged/unstaged state coherent and map badges reliably.
