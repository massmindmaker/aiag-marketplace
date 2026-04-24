import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { SkipLink } from '@/components/SkipLink';
import { MobileMenu } from '@/components/MobileMenu';

describe('VisuallyHidden', () => {
  it('renders content but visually hides it', () => {
    const { container } = render(<VisuallyHidden>secret</VisuallyHidden>);
    const el = container.firstChild as HTMLElement;
    expect(el.textContent).toBe('secret');
    expect(el.className).toContain('absolute');
    expect(el.className).toContain('w-px');
  });
});

describe('SkipLink', () => {
  it('targets #main-content by default with russian label', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#main-content');
    expect(link.textContent).toMatch(/Перейти/);
  });

  it('respects custom targetId + label', () => {
    render(<SkipLink targetId="custom" label="Skip" />);
    const link = screen.getByRole('link', { name: 'Skip' });
    expect(link).toHaveAttribute('href', '#custom');
  });

  it('uses sr-only by default and reveals on focus', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    expect(link.className).toContain('sr-only');
    expect(link.className).toContain('focus:not-sr-only');
  });
});

describe('MobileMenu', () => {
  const items = [
    { href: '/', label: 'Главная' },
    { href: '/marketplace', label: 'Каталог' },
  ];

  it('renders trigger button with aria-label', () => {
    render(<MobileMenu items={items} />);
    expect(screen.getByRole('button', { name: /Открыть меню/ })).toBeInTheDocument();
  });

  it('opens sheet and lists nav items on click', () => {
    render(<MobileMenu items={items} />);
    fireEvent.click(screen.getByRole('button', { name: /Открыть меню/ }));
    expect(screen.getByRole('link', { name: 'Главная' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Каталог' })).toBeInTheDocument();
  });
});
