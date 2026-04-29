'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function ContestSubmissionsActions({
  slug,
  submissionId,
}: {
  slug: string;
  submissionId: string;
  rank: number;
}) {
  const [busy, setBusy] = React.useState(false);
  const setWinner = async (place: number) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/contests/${slug}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ op: 'setWinner', submissionId, rank: place }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(`Ошибка: ${j.error ?? r.status}`);
      } else window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-1 justify-end">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setWinner(1)}>
        🥇
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setWinner(2)}>
        🥈
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setWinner(3)}>
        🥉
      </Button>
    </div>
  );
}
