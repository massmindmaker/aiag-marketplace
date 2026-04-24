import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatPrice, formatNumber } from '@aiag/shared';

export interface ContestCardData {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  banner: string | null;
  sponsorName: string | null;
  prizePoolRub: number;
  participantsCount: number;
  startsAt: Date;
  endsAt: Date;
  status: string;
}

const STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  open: { label: 'Приём работ', variant: 'default' },
  active: { label: 'Приём работ', variant: 'default' },
  evaluating: { label: 'Оценка', variant: 'secondary' },
  announced: { label: 'Анонс', variant: 'outline' },
  upcoming: { label: 'Скоро', variant: 'outline' },
  finished: { label: 'Завершён', variant: 'secondary' },
  completed: { label: 'Завершён', variant: 'secondary' },
  archived: { label: 'Архив', variant: 'secondary' },
};

function Countdown({ endsAt }: { endsAt: Date }) {
  const now = Date.now();
  const diff = endsAt.getTime() - now;
  if (diff <= 0) return <span>завершён</span>;
  const days = Math.floor(diff / 86_400_000);
  if (days >= 1) return <span>осталось {days} дн.</span>;
  const hours = Math.floor(diff / 3_600_000);
  return <span>осталось {hours} ч.</span>;
}

export default function ContestCard({ contest }: { contest: ContestCardData }) {
  const meta = STATUS_META[contest.status] ?? {
    label: contest.status,
    variant: 'outline' as const,
  };

  return (
    <Link
      href={`/contests/${contest.slug}`}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
    >
      <Card className="h-full transition-shadow hover:shadow-lg">
        {/* Banner placeholder (16:9) — real image will come from S3 in Task 22 */}
        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
          {contest.banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={contest.banner}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-6xl opacity-30">🏆</span>
          )}
        </div>

        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {contest.sponsorName && (
              <Badge variant="outline">{contest.sponsorName}</Badge>
            )}
          </div>
          <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
            {contest.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {contest.shortDescription && (
            <p className="line-clamp-2">{contest.shortDescription}</p>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <div className="text-xs uppercase tracking-wide">Призовой фонд</div>
              <div className="font-semibold text-foreground">
                {formatPrice(contest.prizePoolRub)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide">Участники</div>
              <div className="font-semibold text-foreground">
                {formatNumber(contest.participantsCount)}
              </div>
            </div>
          </div>
          {contest.status === 'open' || contest.status === 'active' ? (
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              <Countdown endsAt={contest.endsAt} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
