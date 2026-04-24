import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Invalid email'),
});
type Values = z.infer<typeof schema>;

function TestForm({ onSubmit }: { onSubmit: (v: Values) => void }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormDescription>We never share your email.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

describe('Form (react-hook-form + zod)', () => {
  it('renders label, input, description', () => {
    render(<TestForm onSubmit={() => {}} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByText(/never share/i)).toBeInTheDocument();
  });

  it('shows zod validation error and blocks submit', async () => {
    let submitted = false;
    render(<TestForm onSubmit={() => { submitted = true; }} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
    expect(submitted).toBe(false);
  });

  it('submits valid value', async () => {
    let received: Values | null = null;
    render(<TestForm onSubmit={(v) => { received = v; }} />);
    const input = screen.getByPlaceholderText('you@example.com');
    fireEvent.change(input, { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(received).toEqual({ email: 'a@b.com' });
    });
  });
});
