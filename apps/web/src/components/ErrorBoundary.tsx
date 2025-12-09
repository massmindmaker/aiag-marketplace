'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree
 * and displays a fallback UI instead of crashing
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <AlertTriangle size={64} color="#f44336" />
            </Box>

            <Typography variant="h4" gutterBottom>
              Что-то пошло не так
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить
              страницу или вернуться на главную.
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  textAlign: 'left',
                  bgcolor: 'grey.100',
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Paper>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<RefreshCw size={18} />}
                onClick={this.handleReset}
              >
                Попробовать снова
              </Button>
              <Button
                variant="outlined"
                startIcon={<Home size={18} />}
                onClick={this.handleGoHome}
              >
                На главную
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
