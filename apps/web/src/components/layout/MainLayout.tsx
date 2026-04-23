import * as React from 'react';
import MainNavbar from './MainNavbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Plan 03: shadcn/Tailwind-based layout replacing MUI `styled` version.
 */
const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MainNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default MainLayout;
