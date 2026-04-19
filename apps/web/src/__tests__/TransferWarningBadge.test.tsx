import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransferWarningBadge } from '../components/TransferWarningBadge';

describe('TransferWarningBadge', () => {
  it('renders chip variant with warning icon', () => {
    render(<TransferWarningBadge />);
    expect(screen.getByText(/Трансгр\. передача/i)).toBeInTheDocument();
  });

  it('renders inline variant', () => {
    render(<TransferWarningBadge variant="inline" />);
    expect(screen.getByText(/⚠ Трансгр\. передача/i)).toBeInTheDocument();
  });
});
