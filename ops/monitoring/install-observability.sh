#!/usr/bin/env bash
# Plan 08 Task 7 — Bare-metal install Prometheus + Grafana + Alertmanager + Loki + Promtail
# на Ubuntu 24.04 VPS (5.129.200.99). Запускать от root.
#
# Usage: ssh aiag-vps 'sudo bash -s' < ops/monitoring/install-observability.sh
set -euo pipefail

log() { echo "[$(date +%H:%M:%S)] $*"; }

: "${LOKI_VER:=3.3.2}"
: "${GRAFANA_REPO:=https://apt.grafana.com}"

# 1. apt packages from standard Ubuntu 24.04 + Grafana repo
log "Adding Grafana repo"
install -m 0755 -d /etc/apt/keyrings
wget -qO- https://apt.grafana.com/gpg.key | gpg --dearmor -o /etc/apt/keyrings/grafana.gpg
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] ${GRAFANA_REPO} stable main" > /etc/apt/sources.list.d/grafana.list

log "apt-get update"
apt-get update

log "Installing prometheus + exporters + grafana"
apt-get install -y \
  prometheus \
  prometheus-alertmanager \
  prometheus-node-exporter \
  prometheus-postgres-exporter \
  prometheus-redis-exporter \
  grafana \
  unzip

# 2. Loki + Promtail binaries
log "Downloading Loki ${LOKI_VER}"
for bin in loki promtail; do
  curl -fSL "https://github.com/grafana/loki/releases/download/v${LOKI_VER}/${bin}-linux-amd64.zip" \
    -o "/tmp/${bin}.zip"
  unzip -o "/tmp/${bin}.zip" -d /tmp/
  install -m 0755 "/tmp/${bin}-linux-amd64" "/usr/local/bin/${bin}"
done

# 3. Users for Loki/Promtail
getent passwd loki >/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin loki
getent passwd promtail >/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin promtail
install -d -m 0755 -o loki -g loki /var/lib/loki /etc/loki
install -d -m 0755 -o promtail -g promtail /var/lib/promtail /etc/promtail

# 4. Config files (rsync'd by deploy pipeline or scp manually)
log "Installing configs"
install -m 0644 ops/monitoring/prometheus.yml /etc/prometheus/prometheus.yml
install -m 0644 ops/monitoring/alert-rules.yml /etc/prometheus/alert-rules.yml
install -m 0644 ops/monitoring/alertmanager.yml /etc/prometheus/alertmanager.yml
install -m 0644 ops/monitoring/loki-config.yml /etc/loki/config.yml
install -m 0644 ops/monitoring/promtail-config.yml /etc/promtail/config.yml
install -m 0644 ops/systemd/loki.service /etc/systemd/system/loki.service
install -m 0644 ops/systemd/promtail.service /etc/systemd/system/promtail.service

# Alertmanager env (для TELEGRAM_ALERT_BOT_TOKEN)
install -d -m 0755 /etc/systemd/system/prometheus-alertmanager.service.d
install -m 0644 ops/systemd/alertmanager-telegram.conf /etc/systemd/system/prometheus-alertmanager.service.d/override.conf

# postgres-exporter env
if [[ -n "${PG_METRICS_DSN:-}" ]]; then
  echo "DATA_SOURCE_NAME=\"${PG_METRICS_DSN}\"" > /etc/default/prometheus-postgres-exporter
fi

# 5. nginx reverse proxy для Grafana
if [[ -d /etc/nginx/sites-available ]]; then
  install -m 0644 ops/nginx/grafana.conf /etc/nginx/sites-available/grafana.conf
  ln -sf /etc/nginx/sites-available/grafana.conf /etc/nginx/sites-enabled/grafana.conf
  nginx -t && systemctl reload nginx || log "nginx reload skipped (SSL not issued yet)"
fi

# 6. Systemd enable + start
log "Enabling services"
systemctl daemon-reload
systemctl enable --now \
  prometheus \
  prometheus-alertmanager \
  prometheus-node-exporter \
  prometheus-postgres-exporter \
  prometheus-redis-exporter \
  grafana-server \
  loki \
  promtail

log "Install complete. Next steps:"
log "  1. certbot --nginx -d grafana.ai-aggregator.ru"
log "  2. Edit IP allowlist в /etc/nginx/sites-available/grafana.conf"
log "  3. Открыть Grafana: systemctl status grafana-server; grafana admin pw в /srv/aiag/shared/.env"
log "  4. Настроить Prometheus datasource (http://127.0.0.1:9090) + Loki datasource (http://127.0.0.1:3100)"
log "  5. Импортировать дашборды из ops/monitoring/grafana-dashboards/"
log "  6. Создать Telegram bot @aiag_alerts, записать TOKEN + CHAT_ID в /srv/aiag/shared/.env"
