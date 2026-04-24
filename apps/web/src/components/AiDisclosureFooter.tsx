import Link from 'next/link';

/**
 * Plan 08 — Site-wide AI disclosure footer (Spec §8 item 7).
 * Напоминание о том, что контент генерируется AI и требует верификации.
 */
export function AiDisclosureFooter() {
  return (
    <div className="px-4 py-2 text-center text-[11px] text-muted-foreground">
      Контент генерируется ИИ и может быть неточным. Проверяйте важные факты.{' '}
      <Link href="/ai-disclosure" className="underline hover:text-foreground">
        Подробнее
      </Link>
    </div>
  );
}
