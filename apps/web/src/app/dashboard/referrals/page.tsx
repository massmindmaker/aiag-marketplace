import * as React from 'react';
import { auth } from '@/auth';
import { db, sql, eq } from '@/lib/db';
import { users } from '@aiag/database/schema';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ensureReferralCode, loadReferralSettings } from '@/lib/growth/referral';
import { anonymizeEmail } from '@/lib/growth/codes';
import { rowsOf } from '@/lib/admin/rows';
import { ReferralCopyBlock } from './ReferralCopyBlock';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Реферальная программа — AIAG' };

interface InviteeRow {
  email: string;
  status: 'paid' | 'pending' | 'fraud';
  bonus_rub: string;
  redeemed_at: string | null;
}

async function fetchInvitees(referrerId: string): Promise<InviteeRow[]> {
  const r = await db.execute(sql`
    SELECT u.email,
           CASE
             WHEN rr.fraud_flagged THEN 'fraud'
             WHEN rr.paid_out THEN 'paid'
             ELSE 'pending'
           END AS status,
           rr.bonus_referrer_rub::text AS bonus_rub,
           rr.redeemed_at::text AS redeemed_at
    FROM users u
    LEFT JOIN referral_redemptions rr ON rr.referred_user_id = u.id
    WHERE u.referrer_user_id = ${referrerId}
    ORDER BY u.created_at DESC
    LIMIT 200
  `);
  return rowsOf<InviteeRow>(r);
}

export default async function DashboardReferralsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login?next=/dashboard/referrals');
  const me = await db.query.users.findFirst({ where: eq(users.email, session.user.email) });
  if (!me) redirect('/login');

  const settings = await loadReferralSettings();
  if (!settings.enabled) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Реферальная программа</h1>
        <p className="text-muted-foreground">
          Реферальная программа сейчас отключена. Загляните позже.
        </p>
      </div>
    );
  }

  const code = await ensureReferralCode(me.id, me.email);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-aggregator.ru';
  const link = `${baseUrl}/register?ref=${code}`;

  const invitees = await fetchInvitees(me.id);
  const stats = {
    invited: invitees.length,
    paid: invitees.filter((i) => i.status === 'paid').length,
    pending: invitees.filter((i) => i.status === 'pending').length,
    earned: invitees
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + Number(i.bonus_rub ?? 0), 0),
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Реферальная программа</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Приведи друга — получи {settings.bonusReferrerRub}₽, друг тоже получит{' '}
          {settings.bonusReferredRub}₽ после первого пополнения от {settings.minTopupRub}₽.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ваш код и ссылка</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferralCopyBlock code={code} link={link} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Приглашено" value={String(stats.invited)} />
        <Stat label="Оплатили" value={String(stats.paid)} />
        <Stat label="В ожидании" value={String(stats.pending)} />
        <Stat label="Заработано ₽" value={stats.earned.toFixed(2)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Приглашённые</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Статус</th>
                <th className="text-right px-3 py-2">Бонус ₽</th>
                <th className="text-left px-3 py-2">Дата</th>
              </tr>
            </thead>
            <tbody>
              {invitees.map((i, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{anonymizeEmail(i.email)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {i.status === 'paid' ? Number(i.bonus_rub ?? 0).toFixed(2) : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {i.redeemed_at ? new Date(i.redeemed_at).toLocaleDateString('ru-RU') : '—'}
                  </td>
                </tr>
              ))}
              {invitees.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    Пока никто не пришёл по вашей ссылке. Поделитесь ей!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'paid' | 'pending' | 'fraud' }) {
  if (status === 'paid') return <Badge>оплачен</Badge>;
  if (status === 'fraud') return <Badge variant="destructive">подозрение</Badge>;
  return <Badge variant="outline">ожидание</Badge>;
}
