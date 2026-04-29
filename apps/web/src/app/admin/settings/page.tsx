import * as React from 'react';
import { db, sql } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Настройки — AIAG Admin' };

async function fetchSettings(): Promise<Record<string, unknown>> {
  try {
    const r = await db.execute(sql`SELECT key, value FROM admin_settings`);
    const rows = ((r as unknown as { rows?: { key: string; value: unknown }[] }).rows ??
      (r as unknown as { key: string; value: unknown }[])) || [];
    const obj: Record<string, unknown> = {};
    for (const row of rows) obj[row.key] = row.value;
    return obj;
  } catch (e) {
    console.error(e);
    return {};
  }
}

export default async function AdminSettingsPage() {
  const settings = await fetchSettings();
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold mb-2">Глобальные настройки</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Изменения применяются мгновенно. Каждое изменение пишется в audit_log.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            section="pricing"
            fields={[
              { key: 'fx_usd_rub', label: 'USD→RUB rate', type: 'text' },
              { key: 'default_cost_limit_per_key_rub', label: 'Default cost limit per key (₽/мес)', type: 'number' },
              { key: 'revshare_tiers', label: 'Revshare tiers (JSON)', type: 'json' },
            ]}
            values={settings}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Features</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            section="features"
            fields={[
              { key: 'feature_registration', label: 'Registration enabled', type: 'bool' },
              { key: 'feature_byok', label: 'BYOK enabled', type: 'bool' },
              { key: 'feature_playground', label: 'Playground enabled', type: 'bool' },
              { key: 'free_tier_credits_rub', label: 'Free credits on signup ₽', type: 'number' },
            ]}
            values={settings}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            section="compliance"
            fields={[
              { key: 'rkn_registration_number', label: 'РКН registration number', type: 'text' },
              { key: 'privacy_policy_version', label: 'Privacy policy version', type: 'text' },
              { key: 'maintenance_mode', label: 'Maintenance mode', type: 'bool' },
            ]}
            values={settings}
          />
        </CardContent>
      </Card>
    </div>
  );
}
