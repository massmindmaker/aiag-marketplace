/**
 * Plan 08 Task 7 — Prometheus metrics for gateway.
 *
 * Lightweight in-memory counters + histograms exposed via /metrics в text-format.
 * Не используем prom-client чтобы избежать extra deps — ручная сериализация.
 *
 * Exposed:
 *   - aiag_requests_total{provider, model, status}          counter
 *   - aiag_request_duration_seconds{provider, model}        histogram
 *   - aiag_ttft_seconds{provider, model}                    histogram
 *   - aiag_circuit_breaker_state{provider}                  gauge (0=closed, 1=open, 2=half)
 *   - aiag_balance_exhaustion_total                         counter
 *   - aiag_settlement_failures_total                        counter
 *   - aiag_pii_detections_total{type}                       counter
 *   - aiag_upstream_success_rate_5m{provider}               gauge
 *   - aiag_moderation_blocks_total{provider, reason}        counter
 *   - aiag_transborder_gate_blocks_total                    counter
 */

type Labels = Record<string, string | number>;

const LATENCY_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30];
const TTFT_BUCKETS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 30];

class Counter {
  private values = new Map<string, number>();
  constructor(public name: string, public help: string, public labelNames: string[] = []) {}
  inc(labels: Labels = {}, value = 1) {
    const k = this.key(labels);
    this.values.set(k, (this.values.get(k) ?? 0) + value);
  }
  private key(labels: Labels) {
    return this.labelNames.map((ln) => `${ln}="${String(labels[ln] ?? '')}"`).join(',');
  }
  serialize(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    if (this.values.size === 0) {
      lines.push(`${this.name} 0`);
    } else {
      for (const [k, v] of this.values) {
        lines.push(k ? `${this.name}{${k}} ${v}` : `${this.name} ${v}`);
      }
    }
    return lines.join('\n');
  }
}

class Gauge {
  private values = new Map<string, number>();
  constructor(public name: string, public help: string, public labelNames: string[] = []) {}
  set(labels: Labels, value: number) {
    this.values.set(this.key(labels), value);
  }
  private key(labels: Labels) {
    return this.labelNames.map((ln) => `${ln}="${String(labels[ln] ?? '')}"`).join(',');
  }
  serialize(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} gauge`];
    for (const [k, v] of this.values) {
      lines.push(k ? `${this.name}{${k}} ${v}` : `${this.name} ${v}`);
    }
    return lines.join('\n');
  }
}

class Histogram {
  private counts = new Map<string, number[]>(); // per-label-key: bucket counts array
  private sums = new Map<string, number>();
  private totals = new Map<string, number>();
  constructor(
    public name: string,
    public help: string,
    public buckets: number[],
    public labelNames: string[] = []
  ) {}
  observe(labels: Labels, value: number) {
    const k = this.key(labels);
    let c = this.counts.get(k);
    if (!c) {
      c = new Array(this.buckets.length).fill(0);
      this.counts.set(k, c);
    }
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) c[i]++;
    }
    this.sums.set(k, (this.sums.get(k) ?? 0) + value);
    this.totals.set(k, (this.totals.get(k) ?? 0) + 1);
  }
  private key(labels: Labels) {
    return this.labelNames.map((ln) => `${ln}="${String(labels[ln] ?? '')}"`).join(',');
  }
  serialize(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const [k, counts] of this.counts) {
      const labelPrefix = k ? `{${k},` : '{';
      const labelNoLe = k ? `{${k}}` : '';
      for (let i = 0; i < this.buckets.length; i++) {
        lines.push(`${this.name}_bucket${labelPrefix}le="${this.buckets[i]}"} ${counts[i]}`);
      }
      const total = this.totals.get(k) ?? 0;
      lines.push(`${this.name}_bucket${labelPrefix}le="+Inf"} ${total}`);
      lines.push(`${this.name}_sum${labelNoLe} ${this.sums.get(k) ?? 0}`);
      lines.push(`${this.name}_count${labelNoLe} ${total}`);
    }
    return lines.join('\n');
  }
}

export const metrics = {
  requestsTotal: new Counter(
    'aiag_requests_total',
    'Total gateway requests',
    ['provider', 'model', 'status']
  ),
  requestDuration: new Histogram(
    'aiag_request_duration_seconds',
    'Gateway request duration',
    LATENCY_BUCKETS,
    ['provider', 'model']
  ),
  ttft: new Histogram(
    'aiag_ttft_seconds',
    'Time to first token',
    TTFT_BUCKETS,
    ['provider', 'model']
  ),
  circuitBreakerState: new Gauge(
    'aiag_circuit_breaker_state',
    'Circuit breaker state (0=closed, 1=open, 2=half)',
    ['provider']
  ),
  balanceExhaustion: new Counter(
    'aiag_balance_exhaustion_total',
    'Total 402-insufficient-balance responses'
  ),
  settlementFailures: new Counter(
    'aiag_settlement_failures_total',
    'Total payment settlement failures'
  ),
  piiDetections: new Counter(
    'aiag_pii_detections_total',
    'PII pattern detections in prompts',
    ['type']
  ),
  upstreamSuccessRate: new Gauge(
    'aiag_upstream_success_rate_5m',
    'Upstream success rate (rolling 5min)',
    ['provider']
  ),
  moderationBlocks: new Counter(
    'aiag_moderation_blocks_total',
    'Prompts blocked by moderation middleware',
    ['provider', 'reason']
  ),
  transborderGateBlocks: new Counter(
    'aiag_transborder_gate_blocks_total',
    'Requests blocked by transborder consent gate'
  ),
};

export function serializeMetrics(): string {
  return (
    Object.values(metrics)
      .map((m) => m.serialize())
      .join('\n\n') + '\n'
  );
}
