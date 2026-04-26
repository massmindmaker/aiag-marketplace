# Alert: DiskUsageHigh (severity: high)

## Что означает
Свободного места на диске <20%. VPS-диск = 2 ГБ RAM + ~50 ГБ SSD (Ubuntu 24.04).

## Immediate
- [ ] `df -h /` — фактический %.
- [ ] `du -sh /var/log/* | sort -h | tail -20` — крупные логи.
- [ ] Проверить: pgbackrest репозиторий (`/var/lib/pgbackrest/`), Loki chunks (`/var/lib/loki/chunks/`).

## Resolution
1. Вакуум БД: `psql -c "VACUUM FULL"`.
2. Rotate логов: `journalctl --vacuum-time=7d`, обрезать `/home/aiag-deploy/.pm2/logs/*.log`.
3. Прореживание pgbackrest: уменьшить retention (`pgbackrest --stanza=main --repo1-retention-full=2 expire`).
4. Loki: уменьшить retention_period в `/etc/loki/config.yml` → restart loki.

## Долгосрочно
Если recurring — апгрейд VPS (Timeweb → +50 ГБ диск) или вынести Loki-chunks на Timeweb Object Storage (S3).
