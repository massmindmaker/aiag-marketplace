'use client';

import { Box, Grid, Typography, Button, IconButton, Tooltip } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import TelegramIcon from '@mui/icons-material/Telegram';
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

const HeaderBG = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  zIndex: 0,
  backgroundSize: '100%',
  backgroundPosition: '40% 50%',
  backgroundBlendMode: 'lighten',
  background: `
    url("/mlauto_1.gif"),
    repeating-linear-gradient(45deg,rgba(0,0,0,0),rgba(0,0,0,0) 2px,rgba(255,255,255,0.0) 2px,rgba(255,255,255,0.7) 7px),
    repeating-linear-gradient(-45deg,rgba(0,0,0,0),rgba(0,0,0,0) 2px,rgba(255,255,255,0.0) 2px,rgba(255,255,255,0.7) 7px)
  `,
  '&::before': {
    content: '""',
    backgroundBlendMode: 'multiply',
    background: `
      linear-gradient(-45deg,
      rgba(250, 250, 250,0)35%,
      rgba(0, 0, 0,0.03)50%,
      rgba(250, 250, 250,0)75%
      )`,
    position: 'absolute',
    width: '200%',
    height: '400%',
    top: '-150%',
    left: '-50%',
    overflow: 'hidden',
    display: 'block',
    zIndex: -1,
  },
  [theme.breakpoints.down('md')]: {
    minHeight: '100%',
  },
  [theme.breakpoints.up('md')]: {
    height: 'inherit',
    minHeight: '38em',
  },
}));

const HeaderTitle = styled(Box)(({ theme }) => ({
  background: `linear-gradient(90deg,
    rgba(255, 255, 255,1)30%,
    rgba(250, 250, 250,0.7)100%
    )`,
  width: '100%',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(6),
    paddingLeft: theme.spacing(9),
  },
}));

const HeaderFeatures = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6),
  paddingRight: theme.spacing(12),
  background: `linear-gradient(90deg,
    rgba(253, 253, 253,1)00%,
    rgba(250, 250, 250,0.7)100%
    )`,
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3),
  },
}));

const HeaderSocial = styled(Box)(({ theme }) => ({
  border: '1px solid #e0e0e0',
  borderInlineEnd: '0',
  padding: theme.spacing(1),
  paddingRight: theme.spacing(1),
  gap: theme.spacing(0.5),
  background: `linear-gradient(180deg,
    rgba(255, 255, 255,1)0%,
    rgba(250, 250, 250,0.5)100%
    )`,
  borderRadius: '23px 0 0 23px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignContent: 'center',
}));

const SubheaderBody = styled(Box)(({ theme }) => ({
  backgroundColor: '#fafafb',
  [theme.breakpoints.down('md')]: {
    minHeight: '100%',
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(6),
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
  },
}));

const SubheaderHeader = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  zIndex: 0,
  backgroundSize: '100%',
  backgroundPosition: '40% 50%',
  backgroundBlendMode: 'lighten',
  background: `
    repeating-linear-gradient(45deg,rgba(0,0,0,0),rgba(0,0,0,0) 2px,rgba(255,255,255,0.0) 2px,rgba(255,255,255,0.7) 7px),
    repeating-linear-gradient(-45deg,rgba(0,0,0,0),rgba(0,0,0,0) 2px,rgba(255,255,255,0.0) 2px,rgba(255,255,255,0.7) 7px),
    linear-gradient(90deg,
      rgba(255, 255, 255,1)15%,
      rgba(250, 250, 250,0)75%
      )
  `,
  '&::before': {
    content: '""',
    backgroundBlendMode: 'multiply',
    background: `
      linear-gradient(-45deg,
      rgba(250, 250, 250,0)35%,
      rgba(0, 0, 0,0.03)50%,
      rgba(250, 250, 250,0)75%
      )`,
    position: 'absolute',
    width: '200%',
    height: '400%',
    top: '-150%',
    left: '-50%',
    overflow: 'hidden',
    display: 'block',
    zIndex: -1,
  },
  [theme.breakpoints.down('md')]: {
    minHeight: '10em',
    padding: theme.spacing(3),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(6),
    paddingLeft: theme.spacing(9),
  },
}));

const GuideBody = styled(Box)(({ theme }) => ({
  backgroundColor: '#f9f9fa',
  [theme.breakpoints.down('md')]: {
    minHeight: '100%',
  },
}));

const telegramlink = 'https://t.me/aiaggregatorsupport';

const mockFeatures = [
  {
    title: 'Алгоритмы по подписке',
    content: 'Тестируйте и подключайте популярные готовые решения представленные на нашей платформе',
    tag: 'api',
    link: '',
    linklabel: 'В РАЗРАБОТКЕ',
    disabled: true,
  },
  {
    title: 'Конкурсы',
    content: 'Заявки на разработку можно оформить в виде конкурса и выбрать наиболее успешное решение',
    tag: 'contest',
    link: '',
    linklabel: 'В РАЗРАБОТКЕ',
    disabled: true,
  },
  {
    title: 'Заявки на разработку',
    content: 'Обратитесь к сообществу разработчиков создав заявку на нашей платформе и получите решение по заданным параметрам',
    tag: 'request',
    link: '',
    linklabel: 'В РАЗРАБОТКЕ',
    disabled: false,
  },
];

const mockApiGuide = [
  {
    title: 'Подключайте',
    type: 'apisubscribe',
    description: `Получите доступ к решениям в области исскуственного интеллекта. Если вы хотите интегрировать решение в свою инфраструктуру. Узнайте подробнее, посмотрев быстрый гайд.`,
    buttonText: `Гайд "Подключение АПИ"`,
    buttonToText: `Маркетплейс`,
    buttonLink: '/marketplace',
  },
  {
    title: 'Публикуйте',
    type: 'apicreate',
    description: `Опубликуйте своё решение на платформе. Если вы рабработчик и заинтересованы в привлечении клиентов. Узнайте подробнее посмотрев быстрый гайд.`,
    buttonText: `Гайд "Публикация АПИ"`,
    buttonToText: `Опубликовать АПИ`,
    buttonLink: '/dashboard/api',
  },
];

const mockContestGuide = [
  {
    title: 'Создавайте',
    type: 'contestcreate',
    description: `Всего за несколько действий вы можете создать свой конкурс ИИ. Опишите задачу и загрузите данные, чтобы вместе с сообществом разработчиков найти оптимальное решение.`,
    buttonText: `Гайд "Создание конкурса"`,
    buttonToText: `Создать конкурс`,
    buttonLink: '/dashboard/contest',
  },
  {
    title: 'Участвуйте',
    type: 'contestjoin',
    description: `Участвуйте в конкурсах на нашей платформе. Выигрывайте призы. Тестируйте свои решения. Публикуйте алгоритмы тут же в нашем маркетплейс и получайте вознаграждение.`,
    buttonText: `Гайд "Участие в конкурсе"`,
    buttonToText: `Участвовать`,
    buttonLink: '/marketplace/contests',
  },
];

export default function HomePage() {
  const theme = useTheme();
  const breakpointDownMD = useMediaQuery(theme.breakpoints.down('md'));

  const handleCopyEmail = (message: string) => {
    navigator.clipboard.writeText(message).then(() => {
      alert('Адрес email скопирован в буфер обмена: ' + message);
    }).catch(() => {
      alert('Ошибка при копировании');
    });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  };

  const adaptive = {
    h2: breakpointDownMD ? 'h3' : 'h1',
    h3: breakpointDownMD ? 'h4' : 'h3',
  } as const;

  return (
    <MainLayout>
      <Box height="100%" id="back-to-top-anchor">
        {/* Header Section */}
        <HeaderBG>
          <Grid container sx={{ minHeight: breakpointDownMD ? '100%' : '38em' }}>
            <Grid container alignItems="center" justifyContent="center">
              <Grid item container xs={12}>
                <Box display="flex" flexDirection="column" sx={{ width: '100%' }}>
                  <Box sx={breakpointDownMD ? { flexGrow: '0.5' } : { flexGrow: '1' }} />

                  <Grid container>
                    <Grid item xs={12} md={6}>
                      <HeaderTitle>
                        <Box display="flex" flexDirection="column" sx={{ height: '100%' }}>
                          {!breakpointDownMD && (
                            <Typography
                              variant={adaptive.h2}
                              sx={{ fontWeight: '400', letterSpacing: '-3.7pt' }}
                              color="#181818"
                              noWrap
                            >
                              Ai Aggregator
                            </Typography>
                          )}
                          <Box flexGrow="0.5" />
                          <Typography variant="body1">
                            Маркетплейс алгоритмов искусственного интеллекта
                          </Typography>
                        </Box>
                      </HeaderTitle>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <HeaderFeatures>
                        <Box flexGrow="1" display="flex" flexDirection="column">
                          <Typography variant="h5">
                            Алгоритмы ИИ - быстро, просто, недорого
                          </Typography>
                          <Box height="1em" />
                          <Typography variant="body2">
                            Создайте аккаунт чтобы получить доступ ко всем возможностям платформы
                          </Typography>
                          <Box
                            paddingTop="1em"
                            sx={{
                              display: 'flex',
                              gap: '1em',
                              ...(breakpointDownMD && { flexDirection: 'column' }),
                            }}
                          >
                            <Button
                              component={Link}
                              href="/marketplace"
                              sx={theme.customButton}
                            >
                              Перейти в маркетплейс
                            </Button>
                            <Button
                              component={Link}
                              href="/register"
                              sx={theme.customButtonOutline}
                            >
                              Создать аккаунт
                            </Button>
                          </Box>
                        </Box>
                      </HeaderFeatures>
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <HeaderSocial>
                        <Tooltip title="Telegram: @aiaggregatorsupport" placement="left">
                          <IconButton
                            onClick={() => window.open(telegramlink, '_blank')}
                            sx={{
                              textTransform: 'none',
                              ':hover': { background: '#f0f0f0' },
                              borderRadius: '50%',
                            }}
                          >
                            <TelegramIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="team@ai-aggregator.ru Copy to buffer" placement="left">
                          <IconButton
                            onClick={() => handleCopyEmail('team@ai-aggregator.ru')}
                            sx={{
                              textTransform: 'none',
                              ':hover': { background: '#f0f0f0' },
                              borderRadius: '50%',
                            }}
                          >
                            <AlternateEmailOutlinedIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                      </HeaderSocial>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </HeaderBG>

        {/* Features Section */}
        <SubheaderBody>
          <Grid container justifyContent="center">
          {mockFeatures.map((item, index) => (
            <Grid key={index} item xs={12} md={4} sx={{ p: 3 }} display="flex" flexDirection="column">
              <Box display="flex">
                <Typography variant="h5" sx={{ pb: 3 }}>
                  {item.title}
                </Typography>
              </Box>
              <Typography variant="body1">{item.content}</Typography>
              <Box sx={{ flexGrow: 1, minHeight: 20 }} />
              <Box>
                <Button
                  sx={theme.customButton}
                  onClick={() => scrollToSection(item.tag)}
                >
                  Подробнее
                </Button>
              </Box>
            </Grid>
          ))}
          </Grid>
        </SubheaderBody>

        {/* API Section */}
        <Grid container sx={{ minHeight: '100%' }}>
          <Grid item xs={12}>
            <Box id="api" sx={{ position: 'relative', height: 0 }} />
            <SubheaderHeader>
              <Typography variant={adaptive.h3}>Алгоритмы по подписке</Typography>
            </SubheaderHeader>
          </Grid>
          <SubheaderBody>
            <Grid container>
              {mockApiGuide.map((item, index) => (
                <Grid key={index} item xs={12} md={6} display="flex" flexDirection="column">
                  <Box sx={{ p: 3 }} flexGrow={1} display="flex" flexDirection="column">
                    <Typography variant="h5" sx={{ pb: 3 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body1" sx={{ pb: 3 }}>
                      {item.description}
                    </Typography>
                    <Box flexGrow={1} />
                    <Box display="flex" sx={{ overflow: 'hidden', gap: theme.spacing(0.25) }}>
                      <Button
                        component={Link}
                        href={item.buttonLink}
                        sx={theme.customButtonOutline}
                      >
                        {item.buttonToText}
                      </Button>
                      <Box flexGrow={1} />
                      <Button sx={theme.customButton}>{item.buttonText}</Button>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </SubheaderBody>
        </Grid>

        {/* Contest Section */}
        <Grid container sx={{ minHeight: '100%' }}>
          <Grid item xs={12}>
            <Box id="contest" sx={{ position: 'relative', height: 0 }} />
            <SubheaderHeader>
              <Typography variant={adaptive.h3}>Конкурсы</Typography>
            </SubheaderHeader>
          </Grid>
          <SubheaderBody>
            <Grid container>
              {mockContestGuide.map((item, index) => (
                <Grid key={index} item xs={12} md={6} display="flex" flexDirection="column">
                  <Box sx={{ p: 3 }} flexGrow={1} display="flex" flexDirection="column">
                    <Typography variant="h5" sx={{ pb: 3 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body1" sx={{ pb: 3 }}>
                      {item.description}
                    </Typography>
                    <Box flexGrow={1} />
                    <Box display="flex" sx={{ overflow: 'hidden', gap: theme.spacing(0.25) }}>
                      <Button
                        component={Link}
                        href={item.buttonLink}
                        sx={theme.customButtonOutline}
                      >
                        {item.buttonToText}
                      </Button>
                      <Box flexGrow={1} />
                      <Button sx={theme.customButton}>{item.buttonText}</Button>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </SubheaderBody>
        </Grid>

        {/* Request Section */}
        <GuideBody>
          <Grid container>
            <Grid
              item
              xs={12}
              display="flex"
              alignItems="end"
              sx={{ [theme.breakpoints.up('md')]: { p: 6 }, p: 3 }}
            >
              <Typography id="request" variant={adaptive.h3}>
                Отправить заявку
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              container
              justifyContent="center"
              sx={{ [theme.breakpoints.up('md')]: { p: 3 } }}
            >
              <Box sx={{ p: 3, width: '100%', maxWidth: 800 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Опишите вашу задачу и наши специалисты свяжутся с вами в ближайшее время.
                </Typography>
                <Button
                  component={Link}
                  href="/dashboard/request"
                  sx={theme.customButtonOutline}
                  fullWidth
                >
                  Создать заявку
                </Button>
              </Box>
            </Grid>
          </Grid>
        </GuideBody>

        {/* Footer */}
        <Box
          sx={{
            backgroundColor: '#e3e2e4',
            minHeight: '64px',
            p: 3,
          }}
        >
          <Grid item md={12}>
            <Typography variant="body2" align="center">
              AI AGGREGATOR 2024
            </Typography>
          </Grid>
        </Box>
      </Box>
    </MainLayout>
  );
}
