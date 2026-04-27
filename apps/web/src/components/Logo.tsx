import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  className?: string;
  /** Backwards-compat: ignored. Logo is responsive by default. */
  ismobile?: boolean;
  /** Backwards-compat: ignored. Logo always shows wordmark on >=sm. */
  long?: boolean;
}

/**
 * AIAG wordmark logo.
 * Plan 09 — replaces MUI/img-based logo. Pure text + amber accent on `.ru`.
 */
const Logo = ({ href = '/', className }: LogoProps) => {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center font-mono font-bold tracking-tight text-foreground hover:text-foreground/90 transition-colors',
        className
      )}
      aria-label="AI Aggregator — на главную"
    >
      <span>ai-aggregator</span>
      <span className="text-primary">.ru</span>
    </Link>
  );
};

export default Logo;
