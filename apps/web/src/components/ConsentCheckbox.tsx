'use client';

import * as React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';

export interface ConsentCheckboxProps {
  id: string;
  label: React.ReactNode;
  detailsHref?: string;
  checked: boolean;
  required?: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Reusable consent checkbox for 152-FZ flows.
 *
 * Plan 01 ships an MUI-based version (it's the current design system in apps/web).
 * Plan 03 will migrate this to shadcn/ui without changing the public API.
 */
export function ConsentCheckbox({
  id,
  label,
  detailsHref,
  checked,
  required = false,
  onChange,
}: ConsentCheckboxProps) {
  const labelNode = (
    <Box component="span" sx={{ display: 'inline' }}>
      {label}
      {detailsHref ? (
        <>
          {' '}
          <Link
            href={detailsHref}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            подробнее
          </Link>
        </>
      ) : null}
    </Box>
  );

  return (
    <FormControlLabel
      htmlFor={id}
      required={required}
      control={
        <Checkbox
          id={id}
          checked={checked}
          required={required}
          onChange={(event) => onChange(event.target.checked)}
          inputProps={{
            'aria-required': required || undefined,
          }}
        />
      }
      label={labelNode}
      sx={{ alignItems: 'flex-start', mr: 0 }}
    />
  );
}

export default ConsentCheckbox;
