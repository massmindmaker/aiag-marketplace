import { NextRequest, NextResponse } from 'next/server';
import { sendAlert, type Severity } from '@aiag/telegram-alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Alertmanager webhook receiver.
 * Spec: https://prometheus.io/docs/alerting/latest/configuration/#webhook_config
 *
 * No auth — Alertmanager runs locally; nginx restricts external access.
 */
type AmAlert = {
  status: 'firing' | 'resolved';
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  startsAt?: string;
  endsAt?: string;
  generatorURL?: string;
};

type AmPayload = {
  status?: string;
  receiver?: string;
  alerts?: AmAlert[];
  groupLabels?: Record<string, string>;
  commonLabels?: Record<string, string>;
};

function severityFor(a: AmAlert): Severity {
  if (a.status === 'resolved') return 'resolved';
  const sev = (a.labels?.severity ?? '').toLowerCase();
  if (sev === 'critical') return 'critical';
  if (sev === 'warning') return 'warning';
  return 'info';
}

function formatAlert(a: AmAlert): string {
  const name = a.labels?.alertname ?? 'Alert';
  const summary = a.annotations?.summary ?? a.annotations?.description ?? '';
  const instance = a.labels?.instance ? ` <i>(${a.labels.instance})</i>` : '';
  const lines = [
    `<b>${escape(name)}</b>${instance}`,
    summary ? escape(summary) : '',
  ].filter(Boolean);
  return lines.join('\n');
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as AmPayload;
    const alerts = Array.isArray(body.alerts) ? body.alerts : [];
    if (alerts.length === 0) {
      return NextResponse.json({ ok: true, forwarded: 0 });
    }

    const results = await Promise.all(
      alerts.map((a) => sendAlert(formatAlert(a), severityFor(a)))
    );
    const sent = results.filter((r) => r.ok).length;
    return NextResponse.json({ ok: true, forwarded: sent, total: alerts.length });
  } catch (err) {
    console.error('alerts webhook error', err);
    return NextResponse.json({ error: 'webhook error' }, { status: 500 });
  }
}
