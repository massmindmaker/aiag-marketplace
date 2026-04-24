import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Toaster } from '@/components/ui/Sonner';
import { ThemeProvider } from '@/components/ThemeProvider';

describe('Sonner Toaster', () => {
  it('mounts inside ThemeProvider without crashing', () => {
    const { container } = render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>
    );
    // sonner renders a section with role="region"
    const region = container.querySelector('section');
    expect(region).toBeInTheDocument();
  });

  it('exports toast helper', async () => {
    const { toast } = await import('@/components/ui/Sonner');
    expect(typeof toast).toBe('function');
  });
});
