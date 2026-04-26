# Alert: HttpErrorRate5xx (severity: high)

## Что означает
Общее HTTP 5xx rate >1% за 5 минут. Может быть:
- наш bug (gateway/web crash)
- downstream DB/Redis лег
- OOM (2 ГБ RAM tight)

## Immediate
- [ ] `pm2 list` — все процессы online?
- [ ] `free -h` — RAM.
- [ ] `systemctl status postgresql redis-server nginx` — зависимости.
- [ ] Loki query: `{app=~"web|gateway|worker"} |= "error" |~ "(?i)5\\d\\d"`.

## Resolution
1. OOM → `pm2 restart <app>`; долгосрочно — memory-limit в ecosystem.config.
2. DB down → `systemctl restart postgresql`; проверить data integrity.
3. Deploy regression → pm2 symlink rollback: `ln -sfn releases/<prev> current && pm2 reload all`.

## Escalation
>10 мин unresolved → /status incident + customer email.
