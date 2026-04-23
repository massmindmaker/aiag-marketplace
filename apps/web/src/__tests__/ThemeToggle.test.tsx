import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../components/ThemeProvider';
import { ThemeToggle } from '../components/ThemeToggle';

function wrap(ui: React.ReactNode) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {ui}
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  it('renders three toggle buttons: light / dark / system', async () => {
    render(wrap(<ThemeToggle />));
    expect(
      await screen.findByRole('button', { name: /light/i })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /dark/i })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /system/i })
    ).toBeInTheDocument();
  });

  it('clicking light button adds .light class to <html>', async () => {
    render(wrap(<ThemeToggle />));
    const lightBtn = await screen.findByRole('button', { name: /light/i });
    fireEvent.click(lightBtn);
    await waitFor(() =>
      expect(document.documentElement.classList.contains('light')).toBe(true)
    );
  });
});
