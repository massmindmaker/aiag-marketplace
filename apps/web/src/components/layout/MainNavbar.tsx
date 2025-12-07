'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import InputIcon from '@mui/icons-material/Input';
import Logo from '../Logo';

interface MainNavbarProps {
  onMobileNavOpen?: () => void;
}

const mainMenu = [
  { title: 'Маркетплейс', mobiletitle: 'Маркет', pathname: '/marketplace', authorized: false },
  { title: 'Конкурсы', mobiletitle: 'Конкурсы', pathname: '/contests', authorized: false },
  { title: 'Документация', mobiletitle: 'Доки', pathname: '/docs', authorized: false },
];

const MainNavbar = ({ onMobileNavOpen }: MainNavbarProps) => {
  const theme = useTheme();
  const pathname = usePathname();
  const breakpointDownMD = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState<number | false>(false);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const isHomepage = pathname === '/';

  return (
    <AppBar
      color="secondary"
      elevation={0}
      sx={{
        p: 0,
        borderBottom: 1,
        borderColor: '#fff',
        backgroundColor: '#fff',
      }}
    >
      <Box sx={{ height: '5px' }} />
      <Toolbar variant="dense">
        <Link href="/" onClick={() => setTabValue(false)}>
          <Logo long={!isHomepage && !breakpointDownMD} ismobile={breakpointDownMD} />
        </Link>

        <Box sx={{ flexGrow: 1 }} />

        <Tabs
          value={tabValue}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="standard"
        >
          {mainMenu.map((item, index) => (
            <Tab
              key={index}
              style={{
                minWidth: `${breakpointDownMD ? item.mobiletitle.length : item.title.length * 0.8}em`,
                paddingInline: '1em',
              }}
              label={breakpointDownMD ? item.mobiletitle : item.title}
              value={index}
              component={Link}
              href={item.pathname}
            />
          ))}
        </Tabs>

        <Box sx={{ display: { xs: 'none', md: 'inherit' } }}>
          <IconButton color="inherit" component={Link} href="/login">
            <InputIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <IconButton color="inherit" onClick={onMobileNavOpen}>
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default MainNavbar;
