# Alert: BackupVerificationFailed (severity: CRITICAL)

## Что означает
Daily pgbackrest verification упала — мы не уверены в целостности вчерашнего бэкапа.

## Immediate
- [ ] Проверить лог: `journalctl -u pgbackrest-verify.service -n 200`.
- [ ] Попробовать вручную: `pgbackrest --stanza=main check`.
- [ ] Если storage backend (Timeweb Object Storage) не отвечает — check creds, endpoint.

## Resolution
1. **Credentials expired** — rotate S3 access key в Timeweb, обновить `/etc/pgbackrest/pgbackrest.conf` + `systemctl restart pgbackrest-verify.service`.
2. **Corrupt chunk** — запустить full backup немедленно: `pgbackrest --stanza=main --type=full backup`.
3. **Quota exceeded** — увеличить Timeweb Object Storage план ИЛИ expire старые бэкапы.

## Важно
Без рабочего бэкапа — НЕ делать deploy в prod. Остановить deploy pipeline через GH Actions manual approval.
