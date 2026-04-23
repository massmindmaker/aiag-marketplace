'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Store, CreditCard, FileText, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

const mainMenu = [
  { title: 'Маркетплейс', href: '/marketplace' },
  { title: 'Тарифы', href: '/pricing' },
  { title: 'Документация', href: '/docs' },
];

const drawerItems = [
  { title: 'Главная', href: '/', icon: Home },
  { title: 'Маркетплейс', href: '/marketplace', icon: Store },
  { title: 'Тарифы', href: '/pricing', icon: CreditCard },
  { title: 'Документация', href: '/docs', icon: FileText },
  { title: 'Войти', href: '/login', icon: LogIn },
  { title: 'Регистрация', href: '/register', icon: UserPlus },
];

/**
 * Plan 03: shadcn/Tailwind-based navbar (migrated from MUI AppBar + Tabs + Drawer).
 */
const MainNavbar = () => {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6 gap-4">
        <Link
          href="/"
          className="font-mono font-bold tracking-tight text-foreground"
        >
          ai-aggregator<span className="text-primary">.ru</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ms-8 text-sm">
          {mainMenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-foreground',
                pathname === item.href
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Регистрация</Link>
            </Button>
          </div>
          <button
            type="button"
            aria-label="Открыть меню"
            className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 end-0 w-72 bg-card border-s border-border shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-semibold">Меню</span>
              <button
                type="button"
                aria-label="Закрыть меню"
                className="p-2 rounded-md hover:bg-secondary transition-colors"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="flex flex-col p-2">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-secondary text-primary font-medium'
                          : 'text-foreground hover:bg-secondary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-auto p-4 border-t border-border">
              <ThemeToggle />
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};

export default MainNavbar;
