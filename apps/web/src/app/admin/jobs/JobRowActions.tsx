'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

export function JobRowActions({
  id,
  status,
  output,
  errorMessage,
}: {
  id: string;
  status: string;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
}) {
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const call = async (path: string) => {
    setBusy(true);
    try {
      const r = await fetch(path, { method: 'POST' });
      const j = await r.json();
      if (!r.ok) {
        alert(`Ошибка: ${j.error ?? r.status}`);
      } else {
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  const canRetry = ['failed', 'timeout', 'cancelled'].includes(status);
  const canCancel = ['queued', 'running'].includes(status);

  const outputUrl = (output as { url?: string; output_url?: string } | null)?.url
    ?? (output as { url?: string; output_url?: string } | null)?.output_url
    ?? null;

  return (
    <>
      <div className="flex gap-1 justify-end">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => setOpen(true)}>
          Детали
        </Button>
        {canRetry && (
          <Button
            size="sm"
            variant="default"
            disabled={busy}
            onClick={() => call(`/api/admin/jobs/${id}/retry`)}
          >
            Retry
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => call(`/api/admin/jobs/${id}/cancel`)}
          >
            Cancel
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job details</DialogTitle>
          </DialogHeader>
          {errorMessage && (
            <div className="text-xs text-red-400 mb-3">Error: {errorMessage}</div>
          )}
          {outputUrl && (
            <div className="mb-3">
              <a
                href={outputUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline text-xs"
              >
                Открыть результат →
              </a>
            </div>
          )}
          <pre className="text-xs bg-muted/30 p-3 rounded overflow-x-auto">
            {JSON.stringify(output, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
}
