# CapyUNI Codium - Architecture V2

## Goals
- Separate core IDE runtime from optional product features.
- Make AI provider-agnostic and UI-agnostic.
- Harden terminal bridge with explicit contracts and safety limits.
- Keep local-first behavior while enabling optional sync/snapshots/collaboration.

## Layers
- `core/*`: editor/workspace/terminal/preview/commands/persistence.
- `features/*`: AI, onboarding, productivity, git, etc.
- `platform/*`: sync/snapshots/collaboration/billing/accounts/telemetry.
- `shared/*`: contracts, utilities, security primitives, cross-layer types.

## Current Migration Status
- Introduced foundational stores by domain under `core/*/store`.
- Introduced AI adapter interfaces and provider adapters under `features/ai/providers`.
- Introduced sync/snapshot/collaboration contracts under `platform/*`.
- Legacy UI/runtime still active; migration is incremental via adapters.

## Terminal Safety Baseline
- Use explicit WS message contract (`shared/contracts/terminal.ts`).
- Enforce path normalization and traversal protection (`shared/security/pathSafety.ts`).
- Distinguish server mode `dev` vs `hardened` in PTY backend.

## Next Migration Steps
1. Move legacy `stores/workspaceStore.ts` operations into `core/workspace`.
2. Route `CapyChat` through `features/ai/services/AIOrchestrator`.
3. Extract preview bootloader logic into `core/preview`.
4. Replace prompt/confirm flows with modal-driven product flows.

