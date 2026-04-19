'use client';

import { Chip, Tooltip } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface TransferWarningBadgeProps {
  variant?: 'chip' | 'inline';
}

export function TransferWarningBadge({ variant = 'chip' }: TransferWarningBadgeProps) {
  const tooltip =
    'Эта модель размещена на зарубежных серверах. ' +
    'Ваши промпты передаются через границу (США). ' +
    'Для чувствительных данных используйте модели с меткой «Хостинг РФ».';

  if (variant === 'inline') {
    return (
      <Tooltip title={tooltip}>
        <span style={{ fontSize: 12, color: '#d97706', cursor: 'help' }}>
          ⚠ Трансгр. передача
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltip}>
      <Chip
        icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
        label="Трансгр. передача"
        size="small"
        sx={{
          bgcolor: 'rgba(245, 158, 11, 0.1)',
          color: '#d97706',
          borderColor: '#f59e0b',
          border: '1px solid',
        }}
      />
    </Tooltip>
  );
}
