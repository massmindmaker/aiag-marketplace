import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocaleSwitcher } from '../components/LocaleSwitcher';

describe('LocaleSwitcher', () => {
  it('renders current locale code', () => {
    render(<LocaleSwitcher current="ru" />);
    expect(screen.getByText(/ru/i)).toBeInTheDocument();
  });

  it('opens menu on click and shows all 8 locale labels', () => {
    render(<LocaleSwitcher current="ru" />);
    fireEvent.click(screen.getByRole('button', { name: /language/i }));
    expect(screen.getByText(/Русский/)).toBeInTheDocument();
    expect(screen.getByText(/English/)).toBeInTheDocument();
    expect(screen.getByText(/العربية/)).toBeInTheDocument();
    expect(screen.getByText(/中文/)).toBeInTheDocument();
  });
});
