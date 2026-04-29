'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Props = {
  defaultFrom: string;
  defaultTo: string;
  defaultStatus: string;
  defaultUserEmail: string;
  defaultRequestId: string;
  defaultModel: string;
};

export function RequestsFilters(props: Props) {
  const [from, setFrom] = React.useState(props.defaultFrom);
  const [to, setTo] = React.useState(props.defaultTo);
  const [status, setStatus] = React.useState(props.defaultStatus);
  const [email, setEmail] = React.useState(props.defaultUserEmail);
  const [reqId, setReqId] = React.useState(props.defaultRequestId);
  const [model, setModel] = React.useState(props.defaultModel);

  const onApply = () => {
    const p = new URLSearchParams();
    if (from) p.set('from', new Date(from).toISOString());
    if (to) p.set('to', new Date(to).toISOString());
    if (status) p.set('status', status);
    if (email) p.set('user_email', email);
    if (reqId) p.set('request_id', reqId);
    if (model) p.set('model', model);
    window.location.search = p.toString();
  };

  const onReset = () => {
    window.location.search = '';
  };

  return (
    <Card>
      <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">От</label>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">До</label>
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Статус</label>
          <select
            className="w-full h-9 rounded-md border bg-background px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">все</option>
            <option value="success">success (2xx)</option>
            <option value="4xx">4xx</option>
            <option value="5xx">5xx</option>
            <option value="timeout">timeout</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Email юзера</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@..." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Request ID</label>
          <Input value={reqId} onChange={(e) => setReqId(e.target.value)} placeholder="req_..." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Модель</label>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="openai/..." />
        </div>
        <div className="flex items-end gap-2 col-span-2">
          <Button onClick={onApply}>Применить</Button>
          <Button variant="outline" onClick={onReset}>
            Сбросить
          </Button>
          <span className="text-xs text-muted-foreground self-center ml-auto">
            Макс. диапазон 30 дней
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
