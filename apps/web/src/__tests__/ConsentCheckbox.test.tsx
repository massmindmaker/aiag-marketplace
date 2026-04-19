import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConsentCheckbox } from '../components/ConsentCheckbox';

describe('ConsentCheckbox', () => {
  it('renders the provided label', () => {
    render(
      <ConsentCheckbox
        id="consent-test"
        label="Я согласен с обработкой персональных данных"
        checked={false}
        onChange={() => undefined}
      />
    );

    expect(
      screen.getByText(/Я согласен с обработкой персональных данных/i)
    ).toBeInTheDocument();
  });

  it('calls onChange with true when an unchecked box is clicked', () => {
    const handleChange = vi.fn();
    render(
      <ConsentCheckbox
        id="consent-test"
        label="Согласие"
        checked={false}
        onChange={handleChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('renders an asterisk when required is true', () => {
    render(
      <ConsentCheckbox
        id="consent-required"
        label="Обязательное согласие"
        checked={false}
        required
        onChange={() => undefined}
      />
    );

    // Asterisk should appear somewhere in the rendered output
    expect(screen.getByText(/\*/)).toBeInTheDocument();
  });

  it('does not render an asterisk when required is false or omitted', () => {
    render(
      <ConsentCheckbox
        id="consent-optional"
        label="Необязательное согласие"
        checked={false}
        onChange={() => undefined}
      />
    );

    expect(screen.queryByText(/\*/)).not.toBeInTheDocument();
  });

  it('renders details link when detailsHref is provided', () => {
    render(
      <ConsentCheckbox
        id="consent-with-link"
        label="Согласие"
        detailsHref="/legal/privacy"
        checked={false}
        onChange={() => undefined}
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/legal/privacy');
  });
});
