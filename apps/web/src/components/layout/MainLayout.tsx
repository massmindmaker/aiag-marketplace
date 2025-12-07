'use client';

import { useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MainNavbar from './MainNavbar';

const MainLayoutRoot = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
  width: '100%',
}));

const MainLayoutWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: '1 1 auto',
  overflow: 'hidden',
  paddingTop: 48,
  [theme.breakpoints.up('md')]: {
    paddingBottom: 0,
  },
}));

const MainLayoutContainer = styled('div')({
  display: 'flex',
  flex: '1 1 auto',
  overflow: 'hidden',
});

const MainLayoutContent = styled('div')({
  flex: '1 1 auto',
  height: '100%',
  overflow: 'auto',
});

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const theme = useTheme();
  const breakpointDownMD = useMediaQuery(theme.breakpoints.down('md'));
  const [, setMobileNavOpen] = useState(false);

  return (
    <MainLayoutRoot>
      <MainNavbar onMobileNavOpen={() => setMobileNavOpen(true)} />
      <MainLayoutWrapper
        sx={{
          paddingBottom: breakpointDownMD ? '48px' : 0,
        }}
      >
        <MainLayoutContainer>
          <MainLayoutContent>{children}</MainLayoutContent>
        </MainLayoutContainer>
      </MainLayoutWrapper>
    </MainLayoutRoot>
  );
};

export default MainLayout;
