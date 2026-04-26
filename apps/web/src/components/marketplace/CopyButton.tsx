'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'Копировать' }: Props) {
  const [copied, setCopied] = React.useState(false);
  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      {copied ? (
        <Check className="h-4 w-4 me-1" aria-hidden />
      ) : (
        <Copy className="h-4 w-4 me-1" aria-hidden />
      )}
      {copied ? 'Скопировано' : label}
    </Button>
  );
}
