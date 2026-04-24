'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';

const MAX_SIZE = 100 * 1024 * 1024;
const ALLOWED_EXT = ['csv', 'json'];

export default function SubmissionUploadForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [description, setDescription] = React.useState('');
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<
    'idle' | 'requesting' | 'uploading' | 'confirming' | 'done' | 'error'
  >('idle');
  const [error, setError] = React.useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_SIZE) {
      setError('Файл больше 100 MB');
      return;
    }
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXT.includes(ext)) {
      setError('Разрешены только .csv и .json');
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setStatus('requesting');
    setProgress(0);

    try {
      // Step 1: ask API for signed PUT URL.
      const initRes = await fetch(`/api/contests/${slug}/submissions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          description,
        }),
      });
      if (!initRes.ok) {
        const body = await initRes.json().catch(() => ({}));
        throw new Error(body?.error?.message || 'Не удалось начать загрузку');
      }
      const init = (await initRes.json()) as {
        submissionId: string;
        uploadUrl: string;
      };

      // Step 2: PUT file to S3 with progress (mocked in MVP).
      setStatus('uploading');
      await uploadWithProgress(init.uploadUrl, file, setProgress);

      // Step 3: confirm upload.
      setStatus('confirming');
      const confirmRes = await fetch(
        `/api/contests/${slug}/submissions/${init.submissionId}/confirm`,
        { method: 'POST' }
      );
      if (!confirmRes.ok) throw new Error('Не удалось подтвердить загрузку');

      setStatus('done');
      router.push(`/dashboard/submissions?contest=${slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
      setStatus('error');
    }
  }

  const busy = status !== 'idle' && status !== 'error' && status !== 'done';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Файл (CSV/JSON, до 100 MB)
        </label>
        <Input
          type="file"
          accept=".csv,.json,application/json,text/csv"
          onChange={onFileChange}
          disabled={busy}
        />
        {file && (
          <div className="text-xs text-muted-foreground mt-1">
            {file.name} • {(file.size / 1_048_576).toFixed(2)} MB
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block" htmlFor="sub-desc">
          Комментарий (необязательно)
        </label>
        <Input
          id="sub-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Например: XGBoost baseline с feature engineering"
          disabled={busy}
        />
      </div>

      {status !== 'idle' && status !== 'error' && (
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="text-xs text-muted-foreground">
            {status === 'requesting' && 'Запрашиваем upload URL…'}
            {status === 'uploading' && `Загрузка: ${progress}%`}
            {status === 'confirming' && 'Подтверждение…'}
            {status === 'done' && 'Готово!'}
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <Button type="submit" disabled={!file || busy} className="w-full">
        {busy ? 'Загружаем…' : 'Отправить submission'}
      </Button>
    </form>
  );
}

// MVP: mock progress — real impl uses XHR.upload.onprogress against S3 PUT URL.
async function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
) {
  // If URL points to /api/* we actually PUT it (local mock). Otherwise we just
  // simulate progress for preview.
  if (url.startsWith('/api/')) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error('upload failed')));
      xhr.onerror = () => reject(new Error('upload failed'));
      xhr.open('PUT', url);
      xhr.send(file);
    });
  }
  // Simulate
  for (let p = 0; p <= 100; p += 10) {
    await new Promise((r) => setTimeout(r, 50));
    onProgress(p);
  }
}
