# Test Scaffolding (V2 Migration)

This directory tracks the domain-focused test plan introduced during the V2 migration.

## Targeted Domains

- `core/workspace/services`
  - `workspaceTreeService`
  - `workspaceTabsService`
  - `workspacePathService`
  - `workspaceEffectsService` / sync bridges
- `core/terminal/store/terminalStore`
- command handlers in `core/commands/handlers/registerDefaultCommands.ts`

## Planned Test Strategy

1. Introduce `vitest` + `@vitest/ui` in a dedicated follow-up phase.
2. Add fast unit tests for pure services (tree/path/tabs).
3. Add store-level integration tests for terminal session lifecycle.
4. Add command handler tests using mocked Zustand store states.

## Priority Regression Cases

- Deleting/moving nested folders should keep tree and tabs coherent.
- `getPathForId` and `getFileByPath` parity after refactors.
- Terminal session add/remove/ensure behavior with panel commands.
- Explorer context command payload handling (`rename`, `delete`, `openInTerminal`).

