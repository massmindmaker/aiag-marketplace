'use client';

import { Typography, Box } from '@mui/material';
import Image from 'next/image';

interface LogoProps {
  ismobile?: boolean;
  long?: boolean;
}

const Logo = ({ ismobile, long }: LogoProps) => {
  return (
    <Box sx={{ p: 0 }}>
      {ismobile ? (
        <Box>
          <Image src="/ai_logo_v1.png" alt="Ai-aggregator" width={32} height={32} />
        </Box>
      ) : long ? (
        <Box
          sx={{
            width: '255px',
            flexWrap: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'end',
          }}
        >
          <Image src="/ai_logo_v1.png" alt="Ai-aggregator" width={32} height={32} />
          <Box flexGrow="1" />
          <Typography sx={{ pl: 2 }} fontWeight="fontWeightBold" variant="h6" color="#222">
            Ai-Aggregator
          </Typography>
        </Box>
      ) : (
        <Box sx={{ pl: 4 }}>
          <Image src="/ai_logo_v1.png" alt="Ai-aggregator" width={32} height={32} />
        </Box>
      )}
    </Box>
  );
};

export default Logo;
