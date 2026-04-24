'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

export interface MobileMenuItem {
  href: string;
  label: string;
}

export interface MobileMenuProps {
  items: MobileMenuItem[];
  title?: string;
  triggerLabel?: string;
  side?: 'left' | 'right';
  /** Optional element rendered in the footer (e.g. theme toggle, locale switcher) */
  footer?: React.ReactNode;
}

/**
 * Mobile navigation drawer. Hidden on md+ via the `md:hidden` utility on
 * the trigger so callers don't have to wrap it. Items are simple anchors
 * that close the sheet on click.
 */
export function MobileMenu({
  items,
  title = 'Меню',
  triggerLabel = 'Открыть меню',
  side = 'left',
  footer,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={triggerLabel}>
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <VisuallyHidden>
            <SheetDescription>Навигация по сайту</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1" aria-label={title}>
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </a>
          ))}
        </nav>
        {footer && <div className="mt-auto pt-6">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
