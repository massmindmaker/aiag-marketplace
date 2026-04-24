import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  Separator,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  Select,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

describe('Extended shadcn UI primitives', () => {
  it('Dialog renders trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Hi</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('Sheet renders trigger', () => {
    render(
      <Sheet>
        <SheetTrigger>Menu</SheetTrigger>
        <SheetContent>
          <SheetTitle>Side</SheetTitle>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('Separator renders horizontally by default', () => {
    const { container } = render(<Separator />);
    const sep = container.querySelector('[role="none"]');
    expect(sep).toBeInTheDocument();
  });

  it('Separator vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.firstChild).toHaveClass('w-[1px]');
  });

  it('Avatar renders fallback', () => {
    render(
      <Avatar>
        <AvatarFallback>BB</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('BB')).toBeInTheDocument();
  });

  it('DropdownMenu renders trigger', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      </DropdownMenu>
    );
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('Select renders trigger with placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });
});
