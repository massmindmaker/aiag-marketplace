import * as React from 'react';

type Bar = { name: string; total: number };

export function TopOrgsChart({ data }: { data: Bar[] }) {
  if (data.length === 0) {
    return <div className="text-sm text-muted-foreground">Нет данных</div>;
  }
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <ul className="space-y-1.5 text-xs">
      {data.map((d) => (
        <li key={d.name} className="flex items-center gap-2">
          <span className="w-32 truncate" title={d.name}>
            {d.name}
          </span>
          <div className="flex-1 bg-muted/30 h-4 rounded overflow-hidden">
            <div
              className="bg-amber-500 h-full"
              style={{ width: `${(d.total / max) * 100}%` }}
            />
          </div>
          <span className="w-20 text-right tabular-nums">
            {d.total.toLocaleString('ru-RU')} ₽
          </span>
        </li>
      ))}
    </ul>
  );
}
