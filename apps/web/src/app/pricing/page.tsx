'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Chip,
  Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MainLayout from '@/components/layout/MainLayout';

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#f8f8f8',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
}));

const PricingCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isPopular',
})<{ isPopular?: boolean }>(({ isPopular }) => ({
  position: 'relative',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '16px',
  border: isPopular ? '2px solid #00efdf' : '1px solid #e0e0e0',
  boxShadow: isPopular
    ? '0 8px 24px rgba(0, 239, 223, 0.25)'
    : '0 4px 12px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: isPopular
      ? '0 16px 40px rgba(0, 239, 223, 0.35)'
      : '0 12px 32px rgba(0, 0, 0, 0.15)',
  },
}));

const PopularBadge = styled(Chip)(() => ({
  position: 'absolute',
  top: -12,
  right: 24,
  background: 'linear-gradient(135deg, #00efdf 0%, #0ff 100%)',
  color: '#000',
  fontWeight: 600,
  fontSize: '0.875rem',
  height: '28px',
  boxShadow: '0 4px 12px rgba(0, 239, 223, 0.4)',
}));

const PriceBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const PriceAmount = styled(Typography)(({ theme }) => ({
  fontSize: '3rem',
  fontWeight: 700,
  color: '#333',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'baseline',
  gap: theme.spacing(0.5),
}));

const PriceCurrency = styled('span')(() => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#666',
}));

const PricePeriod = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: '#666',
  marginTop: theme.spacing(1),
}));

const OldPrice = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: '#999',
  textDecoration: 'line-through',
  marginTop: theme.spacing(0.5),
}));

const DiscountBadge = styled(Chip)(({ theme }) => ({
  marginTop: theme.spacing(1),
  background: 'linear-gradient(135deg, rgba(150, 246, 215, 1) 0%, rgba(153, 230, 231, 1) 100%)',
  color: '#000',
  fontWeight: 600,
  fontSize: '0.75rem',
}));

const FeatureList = styled(List)(({ theme }) => ({
  flexGrow: 1,
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

const FeatureItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1, 0),
}));

const FeatureIcon = styled(ListItemIcon)(() => ({
  minWidth: '36px',
  color: '#00efdf',
}));

const ToggleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(6),
  gap: theme.spacing(2),
}));

const BillingText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive?: boolean }>(({ isActive }) => ({
  fontSize: '1.125rem',
  fontWeight: isActive ? 600 : 400,
  color: isActive ? '#333' : '#999',
  transition: 'all 0.3s ease',
}));

const CustomSwitch = styled(Switch)(() => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#00efdf',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: '#555',
    width: 32,
    height: 32,
    '&:before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        '#fff',
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: '#00efdf',
    borderRadius: 20 / 2,
  },
}));

const ActionButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isPrimary',
})<{ isPrimary?: boolean }>(({ theme, isPrimary }) => ({
  borderRadius: '8px',
  padding: theme.spacing(1.5, 4),
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  ...(isPrimary
    ? {
        background: 'linear-gradient(135deg, #00efdf 0%, #0ff 100%)',
        color: '#000',
        border: '1px solid #00efdf',
        '&:hover': {
          background: '#fff',
          border: '1px solid #0ff',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(0, 239, 223, 0.3)',
        },
      }
    : {
        background: 'transparent',
        color: '#555',
        border: '1px solid #555',
        '&:hover': {
          background: '#f8f8f8',
          border: '1px solid #00efdf',
          transform: 'translateY(-2px)',
        },
      }),
}));

interface PricingTier {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  tokens: string;
  features: string[];
  isPopular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    tokens: '1 000 токенов/месяц',
    features: [
      'API доступ',
      '1 000 токенов',
      'Базовые модели',
      'Email поддержка',
    ],
    isPopular: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 990,
    yearlyPrice: 9900,
    tokens: '50 000 токенов/месяц',
    features: [
      'Всё из Free',
      '50 000 токенов',
      'Все модели',
      'Приоритетная поддержка',
      'Аналитика использования',
    ],
    isPopular: true,
  },
  {
    name: 'Business',
    monthlyPrice: 4990,
    yearlyPrice: 49900,
    tokens: '500 000 токенов/месяц',
    features: [
      'Всё из Pro',
      '500 000 токенов',
      'Выделенный менеджер',
      'SLA 99.9%',
      'Кастомные интеграции',
    ],
    isPopular: false,
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU');
  };

  const calculateYearlyMonthly = (yearlyPrice: number) => {
    return Math.round(yearlyPrice / 12);
  };

  const calculateDiscount = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    const yearlyEquivalent = monthlyPrice * 12;
    const discount = Math.round(((yearlyEquivalent - yearlyPrice) / yearlyEquivalent) * 100);
    return discount;
  };

  return (
    <MainLayout>
      <PageContainer>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                color: '#333',
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              Тарифные планы
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#666',
                mb: 4,
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}
            >
              Выберите подходящий тариф для вашего проекта
            </Typography>

            <ToggleContainer>
              <BillingText isActive={!isYearly}>Ежемесячно</BillingText>
              <CustomSwitch
                checked={isYearly}
                onChange={(e) => setIsYearly(e.target.checked)}
              />
              <BillingText isActive={isYearly}>
                Ежегодно
                <Chip
                  label="Скидка 17%"
                  size="small"
                  sx={{
                    ml: 1,
                    background: 'linear-gradient(135deg, #00efdf 0%, #0ff 100%)',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </BillingText>
            </ToggleContainer>
          </Box>

          <Grid container spacing={4} alignItems="stretch">
            {pricingTiers.map((tier) => {
              const displayPrice = isYearly ? calculateYearlyMonthly(tier.yearlyPrice) : tier.monthlyPrice;
              const discount = calculateDiscount(tier.monthlyPrice, tier.yearlyPrice);

              return (
                <Grid item xs={12} md={4} key={tier.name}>
                  <PricingCard isPopular={tier.isPopular}>
                    {tier.isPopular && <PopularBadge label="Популярный" />}

                    <CardContent sx={{ flexGrow: 1, pt: 4, pb: 2 }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 600,
                          color: '#555',
                          mb: 1,
                        }}
                      >
                        {tier.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          mb: 2,
                        }}
                      >
                        {tier.tokens}
                      </Typography>

                      <PriceBox>
                        <PriceAmount>
                          {formatPrice(displayPrice)}
                          <PriceCurrency>₽</PriceCurrency>
                        </PriceAmount>
                        <PricePeriod>
                          {isYearly ? 'в месяц при годовой оплате' : 'в месяц'}
                        </PricePeriod>

                        {isYearly && tier.yearlyPrice > 0 && (
                          <>
                            <OldPrice>
                              {formatPrice(tier.monthlyPrice)}₽/месяц
                            </OldPrice>
                            <DiscountBadge label={`Экономия ${discount}%`} size="small" />
                          </>
                        )}
                      </PriceBox>

                      <FeatureList>
                        {tier.features.map((feature, index) => (
                          <FeatureItem key={index} disableGutters>
                            <FeatureIcon>
                              <CheckCircleIcon />
                            </FeatureIcon>
                            <ListItemText
                              primary={feature}
                              primaryTypographyProps={{
                                fontSize: '0.95rem',
                                color: '#333',
                              }}
                            />
                          </FeatureItem>
                        ))}
                      </FeatureList>
                    </CardContent>

                    <CardActions sx={{ p: 3, pt: 0 }}>
                      <ActionButton
                        variant="contained"
                        fullWidth
                        isPrimary={tier.isPopular}
                      >
                        {tier.monthlyPrice === 0 ? 'Начать бесплатно' : 'Выбрать план'}
                      </ActionButton>
                    </CardActions>
                  </PricingCard>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
              Все планы включают доступ к API и базовую техническую поддержку
            </Typography>
            <Typography variant="body2" sx={{ color: '#999' }}>
              Нужен индивидуальный план? Свяжитесь с нами для обсуждения корпоративных условий
            </Typography>
          </Box>
        </Container>
      </PageContainer>
    </MainLayout>
  );
}
