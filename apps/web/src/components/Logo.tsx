'use client';

import { Typography, Box } from '@mui/material';

interface LogoProps {
  ismobile?: boolean;
  long?: boolean;
}

const Logo = ({ ismobile, long }: LogoProps) => {
  return (
    <Box sx={{ p: 0, display: 'flex', alignItems: 'center' }}>
      {ismobile ? (
        <Box>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ai_logo_v1.png" alt="Ai-aggregator" width={32} height={32} />
        </Box>
      ) : long ? (
        <Box
          sx={{
            width: '255px',
            flexWrap: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ai_logo_v1.png" alt="Ai-aggregator" width={32} height={32} />
          <Typography sx={{ pl: 2 }} fontWeight="fontWeightBold" variant="h6" color="#222">
            Ai-Aggregator
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ai_logo_v1.png" alt="Ai-aggregator" width={32} height={32} />
        </Box>
      )}
    </Box>
  );
};

export default Logo;
