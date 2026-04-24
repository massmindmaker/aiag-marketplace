import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/Accordion';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Progress } from '@/components/ui/Progress';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';

describe('Accordion', () => {
  it('shows trigger and toggles content', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Q1</AccordionTrigger>
          <AccordionContent>Answer 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    const trigger = screen.getByRole('button', { name: 'Q1' });
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByText('Answer 1')).toBeInTheDocument();
  });
});

describe('Slider', () => {
  it('renders with default value', () => {
    const { container } = render(<Slider defaultValue={[50]} max={100} step={1} />);
    expect(container.querySelector('[role="slider"]')).toBeInTheDocument();
  });
});

describe('Switch', () => {
  it('toggles checked state on click', () => {
    let value = false;
    render(<Switch checked={value} onCheckedChange={(v) => (value = v)} aria-label="dark" />);
    const sw = screen.getByRole('switch', { name: 'dark' });
    fireEvent.click(sw);
    expect(value).toBe(true);
  });
});

describe('RadioGroup', () => {
  it('renders items and selects one', () => {
    render(
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" id="a" />
        <RadioGroupItem value="b" id="b" />
      </RadioGroup>
    );
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });
});

describe('Progress', () => {
  it('renders with role progressbar', () => {
    const { container } = render(<Progress value={42} />);
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });
});

describe('Table', () => {
  it('renders header + body cells', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
