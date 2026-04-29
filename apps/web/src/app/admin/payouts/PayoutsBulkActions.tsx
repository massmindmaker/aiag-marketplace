'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function PayoutsBulkActions() {
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const all = document.getElementById('select-all') as HTMLInputElement | null;
    if (!all) return;
    const handler = () => {
      document.querySelectorAll<HTMLInputElement>('.payout-cb').forEach((cb) => {
        cb.checked = all.checked;
      });
    };
    all.addEventListener('change', handler);
    return () => all.removeEventListener('change', handler);
  }, []);

  const onProcess = async () => {
    const ids = Array.from(document.querySelectorAll<HTMLInputElement>('.payout-cb:checked')).map(
      (cb) => cb.value
    );
    if (ids.length === 0) {
      alert('Не выбран ни один автор');
      return;
    }
    if (!confirm(`Запустить выплаты для ${ids.length} авторов?`)) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/payouts/process', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userIds: ids }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) alert(`Ошибка: ${j.error ?? r.status}`);
      else {
        alert(`Создано ${j.created ?? 0} payout-задач`);
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 flex gap-2">
      <Button variant="default" disabled={busy} onClick={onProcess}>
        Approve & process selected
      </Button>
    </div>
  );
}
