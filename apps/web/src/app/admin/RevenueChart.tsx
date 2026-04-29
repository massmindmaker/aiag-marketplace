import * as React from 'react';

type Point = { date: string; total: number };

export function RevenueChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return <div className="text-sm text-muted-foreground">Нет данных</div>;
  }

  const w = 600;
  const h = 200;
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.total));
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);

  const points = data
    .map((d, i) => `${pad + i * stepX},${h - pad - (d.total / max) * (h - pad * 2)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="currentColor" opacity="0.2" />
      <polyline fill="none" stroke="rgb(245 158 11)" strokeWidth="2" points={points} />
      {data.map((d, i) => (
        <circle
          key={d.date}
          cx={pad + i * stepX}
          cy={h - pad - (d.total / max) * (h - pad * 2)}
          r="2"
          fill="rgb(245 158 11)"
        >
          <title>
            {d.date}: {d.total.toLocaleString('ru-RU')} ₽
          </title>
        </circle>
      ))}
      <text x={pad} y={pad - 6} className="fill-current text-[10px]" opacity="0.6">
        макс {max.toLocaleString('ru-RU')} ₽
      </text>
    </svg>
  );
}
