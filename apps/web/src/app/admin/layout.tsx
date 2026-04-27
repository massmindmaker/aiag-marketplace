import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';

/**
 * Admin layout: minimal RBAC stub.
 *
 * TODO: real role check. For now we only require an authenticated session;
 * full RBAC ('admin' role) lands in a follow-up plan. Anyone able to log in
 * sees the admin queue — acceptable while staging is closed-beta.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?next=/admin');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center gap-6 text-sm">
          <Link href="/admin" className="font-semibold">
            Админка
          </Link>
          <Link href="/admin/models" className="hover:text-primary">
            Модели
          </Link>
          <Link href="/admin/moderation/models" className="hover:text-primary">
            Модерация
          </Link>
          <Link href="/admin/moderation/submissions" className="hover:text-primary">
            Сабмишены
          </Link>
          <span className="ml-auto text-muted-foreground">
            {session.user.email}
          </span>
        </div>
      </nav>
      {children}
    </div>
  );
}
