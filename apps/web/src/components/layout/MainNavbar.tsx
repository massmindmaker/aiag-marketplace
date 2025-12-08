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
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import InputIcon from '@mui/icons-material/Input';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DescriptionIcon from '@mui/icons-material/Description';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Logo from '../Logo';


const mainMenu = [
  { title: 'Маркетплейс', mobiletitle: 'Маркет', pathname: '/marketplace', authorized: false },
  { title: 'Конкурсы', mobiletitle: 'Конкурсы', pathname: '/contests', authorized: false },
  { title: 'Документация', mobiletitle: 'Доки', pathname: '/docs', authorized: false },
];

const drawerMenuItems = [
  { title: 'Главная', pathname: '/', icon: HomeIcon },
  { title: 'Маркетплейс', pathname: '/marketplace', icon: StoreIcon },
  { title: 'Тарифы', pathname: '/pricing', icon: CreditCardIcon },
  { title: 'Документация', pathname: '/docs', icon: DescriptionIcon },
];

const drawerAuthItems = [
  { title: 'Войти', pathname: '/login', icon: LoginIcon },
  { title: 'Регистрация', pathname: '/register', icon: PersonAddIcon },
];

const MainNavbar = () => {
  const theme = useTheme();
  const pathname = usePathname();
  const breakpointDownMD = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState<number | false>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
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
          <IconButton color="inherit" onClick={handleDrawerOpen}>
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: '#fff',
          },
        }}
        transitionDuration={{
          enter: 300,
          exit: 250,
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Меню
          </Typography>
          <IconButton onClick={handleDrawerClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Main Menu Items */}
        <List sx={{ pt: 0 }}>
          {drawerMenuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <ListItem
                key={index}
                component={Link}
                href={item.pathname}
                onClick={handleDrawerClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontWeight: pathname === item.pathname ? 600 : 400,
                    color: pathname === item.pathname ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Auth Items */}
        <List sx={{ pt: 0 }}>
          {drawerAuthItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <ListItem
                key={index}
                component={Link}
                href={item.pathname}
                onClick={handleDrawerClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontWeight: pathname === item.pathname ? 600 : 400,
                    color: pathname === item.pathname ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItem>
            );
          })}
        </List>
      </Drawer>
    </AppBar>
  );
};

export default MainNavbar;
