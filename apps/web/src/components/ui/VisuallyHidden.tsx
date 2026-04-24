import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Visually hides content while keeping it available to assistive
 * technologies. Use sparingly — usually for icon-only buttons or
 * supplemental context that screen readers need.
 */
export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0',
      'clip-[rect(0,0,0,0)]',
      className
    )}
    style={{
      clip: 'rect(0 0 0 0)',
      clipPath: 'inset(50%)',
      ...props.style,
    }}
    {...props}
  />
));
VisuallyHidden.displayName = 'VisuallyHidden';
