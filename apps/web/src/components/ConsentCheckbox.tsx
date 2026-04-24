'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';

export interface ConsentCheckboxProps {
  id: string;
  label: React.ReactNode;
  detailsHref?: string;
  checked: boolean;
  required?: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Reusable consent checkbox for 152-ФЗ flows.
 * Plan 03: migrated from MUI to shadcn/ui (Radix Checkbox primitive).
 * Public API is preserved (same props).
 */
export function ConsentCheckbox({
  id,
  label,
  detailsHref,
  checked,
  required = false,
  onChange,
}: ConsentCheckboxProps) {
  return (
    <div className={cn('flex items-start gap-2')}>
      <Checkbox
        id={id}
        checked={checked}
        required={required}
        onCheckedChange={(v) => onChange(v === true)}
        aria-required={required || undefined}
        className="mt-0.5"
      />
      <label
        htmlFor={id}
        className="text-sm leading-snug text-foreground cursor-pointer select-none"
      >
        <span>
          {label}
          {required ? (
            <span className="text-destructive ms-0.5" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
        {detailsHref ? (
          <>
            {' '}
            <a
              href={detailsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              подробнее
            </a>
          </>
        ) : null}
      </label>
    </div>
  );
}

export default ConsentCheckbox;
