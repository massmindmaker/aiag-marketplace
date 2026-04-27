# aiag-worker — setup & operations

`apps/worker/` is the AIAG background worker. It runs on the VPS as a pm2
app named `aiag-worker` (port 4001 for `/health`).

## Queues

All queues are BullMQ over Redis (single connection, shared with the gateway).
Canonical names live in `apps/worker/src/queues/names.ts`.

| Queue            | Purpose                                                                                              | Producer                |
|------------------|------------------------------------------------------------------------------------------------------|-------------------------|
| `upstream-poll`  | Poll async-completion upstreams (fal, kie, replicate). Mirrors media to S3, updates `prediction_jobs`.| `apps/api-gateway`     |
| `contest-eval`   | Run user-supplied python evaluator scripts in a sandbox; updates `evaluations`.                       | `apps/web` (admin/queue)|
| `webhook-retry`  | Retry failed outbound webhook deliveries with exponential backoff (max 5 attempts).                   | `apps/api-gateway`, web |
| `email-send`     | Async transactional email send (stub transport until Phase 2 wires `@aiag/email`).                    | any                     |

## Probes

* **Internal probe** (every 60s) — pings PG `SELECT 1` and Redis `PING`. On a
  healthy → unhealthy transition fires a Telegram alert (Phase 2 wires
  `@aiag/telegram-alerts`).
* **Upstream probe** (every 5min) — placeholder; once the gateway exposes a
  per-adapter cheap probe (e.g. `/models` HEAD) the worker will fan out and
  insert rows into `upstream_health`.

## Eval-runner sandbox

`apps/worker/src/eval-runner/runner.ts` wraps `python3` invocation:

* On **Linux** the wrapper is `systemd-run --scope` with:
  * `MemoryLimit=1G`, `CPUQuota=200%`, `TasksMax=64`
  * `NoNewPrivileges=true`, `uid=nobody`, `gid=nogroup`
  * `PrivateNetwork=yes` (no egress)
  * `ProtectSystem=strict` + `ReadWritePaths=<tmpdir>` (read-only FS apart from workdir)
* On **dev (non-Linux)** it falls back to plain `python3` for local testing.

Wallclock cap defaults to 5 min and is enforced via `SIGKILL` after `timeoutMs`.

### Required sudoers entry on VPS

The worker user (`aiag`) must be allowed to invoke `systemd-run --scope`
without a password. Add to `/etc/sudoers.d/aiag-worker`:

```
aiag ALL=(root) NOPASSWD: /usr/bin/systemd-run --scope *
```

> SECURITY-TODO Phase 2: replace `systemd-run` with **nsjail** (per-call
> sandboxed binary, no sudoers) or schedule eval jobs into a dedicated **k3s**
> namespace with PodSecurityAdmission. Tracking issue: TBD.

## Deploy

1. The `deploy` GitHub Actions workflow (`.github/workflows/deploy.yml`) builds
   the monorepo and rsyncs `/srv/aiag/worker/releases/<sha>/`.
2. The release symlink is flipped: `/srv/aiag/worker/current → releases/<sha>`.
3. `pm2 reload ecosystem.config.cjs --update-env` reloads `aiag-worker`.

The new `aiag-worker` app is added in `ops/ecosystem.config.cjs`. The
merge-wave will deploy it; do not run pm2 from a feature branch.

## Environment variables

| Var | Required | Notes |
|-----|----------|-------|
| `REDIS_URL` | yes | Shared with gateway |
| `DATABASE_URL` | yes | PG over SSH tunnel `127.0.0.1:15432` on VPS |
| `SHARED_ENV_PATH` | no | Defaults to `/srv/aiag/shared/.env` |
| `LOG_LEVEL` | no | pino level, default `info` |
| `PORT` | no | `/health` server, default `4001` |

## Migration

`packages/database/migrations/0008_health_circuit.sql` adds `upstream_health`.
Apply with:

```bash
cat packages/database/migrations/0008_health_circuit.sql \
  | ssh aiag-vps 'sudo -u postgres psql -d aiag'
```

## Tests

```bash
pnpm --filter @aiag/worker test
pnpm --filter @aiag/upstream-adapters test  # circuit-breaker tests
```

All queue processors are covered by unit tests using `vitest` mocks (no real
Redis required).
