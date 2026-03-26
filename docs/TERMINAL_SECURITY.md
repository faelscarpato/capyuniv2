# Terminal Security Model

## Modes
- `dev` (default): accepts loopback + private network clients; local origins only.
- `hardened`: accepts loopback only and explicit origins from `CAPY_ALLOWED_ORIGINS`.

## Boundaries
- PTY server listens on `0.0.0.0` in dev, `127.0.0.1` in hardened.
- Every file operation is normalized and constrained to `.workspace`.
- Path traversal and absolute path writes are rejected.

## Runtime Limits
- Max WS payload: `512KB`.
- Max terminal input chunk: `8KB`.
- Max read/write file size: `1MB`.
- Max scan nodes per request: `5000`.

## TODO
- Add per-session auth token for WS upgrade.
- Add audit logging for privileged commands.
- Add optional denylist for executable commands in hardened mode.

