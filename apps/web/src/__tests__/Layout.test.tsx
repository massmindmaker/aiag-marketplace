import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Container, Section, Stack } from '@/components/ui/Layout';

describe('Layout primitives', () => {
  describe('Container', () => {
    it('applies default xl + lg padding', () => {
      const { container } = render(<Container data-testid="c">x</Container>);
      const el = container.firstChild as HTMLElement;
      expect(el.className).toContain('max-w-screen-xl');
      expect(el.className).toContain('px-4');
    });

    it('respects size + padding variants', () => {
      const { container } = render(
        <Container size="prose" padding="none">x</Container>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.className).toContain('max-w-3xl');
      expect(el.className).not.toMatch(/\bpx-/);
    });

    it('renders custom element via `as`', () => {
      const { container } = render(<Container as="main">x</Container>);
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('Section', () => {
    it('applies default md spacing', () => {
      const { container } = render(<Section>x</Section>);
      const el = container.firstChild as HTMLElement;
      expect(el.tagName).toBe('SECTION');
      expect(el.className).toContain('py-12');
    });

    it('honors bg + spacing variants', () => {
      const { container } = render(
        <Section spacing="xl" bg="muted">x</Section>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.className).toContain('py-24');
      expect(el.className).toContain('bg-muted/40');
    });
  });

  describe('Stack', () => {
    it('defaults to flex-col with gap-4 + items-stretch', () => {
      const { container } = render(<Stack>x</Stack>);
      const el = container.firstChild as HTMLElement;
      expect(el.className).toContain('flex');
      expect(el.className).toContain('flex-col');
      expect(el.className).toContain('gap-4');
      expect(el.className).toContain('items-stretch');
    });

    it('row direction with custom gap + justify', () => {
      const { container } = render(
        <Stack direction="row" gap={8} justify="between">x</Stack>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.className).toContain('flex-row');
      expect(el.className).toContain('gap-8');
      expect(el.className).toContain('justify-between');
    });

    it('wrap variant emits flex-wrap', () => {
      const { container } = render(<Stack wrap>x</Stack>);
      expect((container.firstChild as HTMLElement).className).toContain('flex-wrap');
    });
  });
});
