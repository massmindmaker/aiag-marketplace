import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterPage from '../app/(auth)/register/page';

/**
 * Plan 01 Step 6.1 — Register page must enforce 3 separate 152-FZ consents
 * (per May 2025 amendments):
 *   1. Processing of personal data (required)
 *   2. Transborder transfer (required)
 *   3. Marketing communications (optional)
 *
 * The submit button must remain disabled until both required consents are checked.
 */
describe('Register — 152-fz consents', () => {
  it('submit button disabled until all required consents (processing + transborder) are checked', () => {
    render(<RegisterPage />);

    // Fill required form fields so the only blocker is consents.
    fireEvent.change(screen.getByLabelText(/Имя/i), {
      target: { value: 'Иван Иванов' },
    });
    fireEvent.change(screen.getByLabelText(/^Email/i), {
      target: { value: 'ivan@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Пароль/i), {
      target: { value: 'StrongPass1' },
    });
    fireEvent.change(screen.getByLabelText(/Подтвердите пароль/i), {
      target: { value: 'StrongPass1' },
    });

    const submit = screen.getByRole('button', { name: /Зарегистрироваться/i });
    expect(submit).toBeDisabled();

    // Check only processing — still disabled.
    fireEvent.click(screen.getByLabelText(/обработк[уи].*персональных данных/i));
    expect(submit).toBeDisabled();

    // Check transborder — now enabled.
    fireEvent.click(screen.getByLabelText(/трансгранич/i));
    expect(submit).not.toBeDisabled();
  });

  it('marketing consent is optional — does not affect submit button state', () => {
    render(<RegisterPage />);

    const submit = screen.getByRole('button', { name: /Зарегистрироваться/i });

    // Check both required consents.
    fireEvent.click(screen.getByLabelText(/обработк[уи].*персональных данных/i));
    fireEvent.click(screen.getByLabelText(/трансгранич/i));
    expect(submit).not.toBeDisabled();

    // Toggle marketing consent — submit must remain enabled either way.
    const marketing = screen.getByLabelText(/маркетинг|рассылк/i);
    fireEvent.click(marketing);
    expect(submit).not.toBeDisabled();

    fireEvent.click(marketing);
    expect(submit).not.toBeDisabled();
  });
});
