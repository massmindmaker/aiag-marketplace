'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

interface TransferWarningBadgeProps {
  variant?: 'chip' | 'inline';
}

const TOOLTIP =
  'Эта модель размещена на зарубежных серверах. ' +
  'Ваши промпты передаются через границу (США). ' +
  'Для чувствительных данных используйте модели с меткой «Хостинг РФ».';

/**
 * Plan 03: migrated from MUI Chip + Tooltip to shadcn Badge + Radix Tooltip.
 * Amber accent per design tokens.
 */
export function TransferWarningBadge({
  variant = 'chip',
}: TransferWarningBadgeProps) {
  if (variant === 'inline') {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs cursor-help',
                'text-[color:var(--accent-hover)]'
              )}
            >
              ⚠ Трансгр. передача
            </span>
          </TooltipTrigger>
          <TooltipContent>{TOOLTIP}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1 border-primary/60 bg-primary/10 text-[color:var(--accent-hover)] cursor-help'
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            Трансгр. передача
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{TOOLTIP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
