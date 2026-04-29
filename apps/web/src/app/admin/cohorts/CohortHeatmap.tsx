import * as React from 'react';

interface Heatmap {
  weeks: string[];
  days: number[];
  values: (number | null)[][];
  sizes: number[];
}

function colorFor(value: number | null, max: number, mode: string): string {
  if (value == null) return 'bg-muted/20';
  if (max <= 0) return 'bg-muted/20';
  const p = Math.max(0, Math.min(1, value / max));
  if (mode === 'active' || mode === 'paying') {
    // green scale 0..100
    const intensity = Math.round(p * 5); // 0..5
    const map = [
      'bg-emerald-50/30',
      'bg-emerald-100',
      'bg-emerald-200',
      'bg-emerald-300',
      'bg-emerald-400',
      'bg-emerald-500',
    ];
    return map[intensity] ?? map[0];
  }
  // amber scale for money
  const intensity = Math.round(p * 5);
  const map = [
    'bg-amber-50/30',
    'bg-amber-100',
    'bg-amber-200',
    'bg-amber-300',
    'bg-amber-400',
    'bg-amber-500',
  ];
  return map[intensity] ?? map[0];
}

export function CohortHeatmap({
  heatmap,
  mode,
  days,
}: {
  heatmap: Heatmap;
  mode: string;
  days: number[];
}) {
  const flat = heatmap.values.flat().filter((v): v is number => v != null);
  const max = flat.length ? Math.max(...flat) : 0;

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr>
          <th className="text-left px-3 py-2 font-medium">Когорта (неделя)</th>
          <th className="text-right px-3 py-2 font-medium">Размер</th>
          {days.map((d) => (
            <th key={d} className="text-center px-3 py-2 font-medium">
              D{d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {heatmap.weeks.map((w, i) => (
          <tr key={w} className="border-t">
            <td className="px-3 py-2 font-mono">{w}</td>
            <td className="px-3 py-2 text-right">{heatmap.sizes[i]}</td>
            {days.map((d, j) => {
              const v = heatmap.values[i]?.[j] ?? null;
              return (
                <td
                  key={d}
                  className={`px-3 py-2 text-center text-foreground ${colorFor(v, max, mode)}`}
                >
                  {v == null
                    ? '—'
                    : mode === 'active' || mode === 'paying'
                    ? `${v}%`
                    : v.toLocaleString('ru-RU')}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
