import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Layout primitives — small composable wrappers around Tailwind classes
 * to keep page-level structure consistent without ad-hoc utility soup.
 *
 * - Container: max-width + horizontal padding
 * - Section: vertical rhythm wrapper for top-level page sections
 * - Stack: vertical or horizontal flex layout with spacing
 */

// ---------------- Container ----------------

const containerVariants = cva('mx-auto w-full', {
  variants: {
    size: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      prose: 'max-w-3xl',
      full: 'max-w-none',
    },
    padding: {
      none: '',
      sm: 'px-4',
      md: 'px-4 sm:px-6',
      lg: 'px-4 sm:px-6 lg:px-8',
    },
  },
  defaultVariants: { size: 'xl', padding: 'lg' },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: keyof JSX.IntrinsicElements;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, as: Tag = 'div', ...props }, ref) => {
    const Comp = Tag as 'div';
    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(containerVariants({ size, padding }), className)}
        {...props}
      />
    );
  }
);
Container.displayName = 'Container';

// ---------------- Section ----------------

const sectionVariants = cva('w-full', {
  variants: {
    spacing: {
      none: '',
      sm: 'py-8 sm:py-12',
      md: 'py-12 sm:py-16',
      lg: 'py-16 sm:py-24',
      xl: 'py-24 sm:py-32',
    },
    bg: {
      default: '',
      muted: 'bg-muted/40',
      surface: 'bg-card',
    },
  },
  defaultVariants: { spacing: 'md', bg: 'default' },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, bg, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(sectionVariants({ spacing, bg }), className)}
      {...props}
    />
  )
);
Section.displayName = 'Section';

// ---------------- Stack ----------------

const stackVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
    },
    gap: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8',
      12: 'gap-12',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    },
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },
  },
  defaultVariants: { direction: 'col', gap: 4, align: 'stretch', wrap: false },
});

export interface StackProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'wrap'>,
    VariantProps<typeof stackVariants> {
  as?: keyof JSX.IntrinsicElements;
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    { className, direction, gap, align, justify, wrap, as: Tag = 'div', ...props },
    ref
  ) => {
    const Comp = Tag as 'div';
    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          stackVariants({ direction, gap, align, justify, wrap }),
          className
        )}
        {...props}
      />
    );
  }
);
Stack.displayName = 'Stack';

export { Container, Section, Stack, containerVariants, sectionVariants, stackVariants };
