import * as React from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import SubmissionUploadForm from './SubmissionUploadForm';

export const metadata = { title: 'Загрузка submission — AI-Aggregator' };

/**
 * Plan 07 Task 5: submission upload form.
 *
 * MVP uploads via mocked signed-URL flow — real S3 bucket config comes in
 * Task 22 when aiag-submissions is provisioned.
 */
export default function ContestSubmitPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Link
          href={`/contests/${params.slug}`}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          ← Вернуться к конкурсу
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Загрузить submission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground mb-6">
              <p>
                Загрузите CSV или JSON файл с предсказаниями. Максимум 100 MB.
                Файл пройдёт антивирусную проверку (ClamAV), валидацию схемы и
                затем будет оценен в изолированном sandbox-окружении.
              </p>
              <p className="text-xs">
                Лимит — 20 загрузок в день, 5 одновременных в обработке.
                Результат появится в <Link href={`/contests/${params.slug}/leaderboard`} className="text-primary underline-offset-4 hover:underline">leaderboard</Link> и на странице «Мои submissions».
              </p>
            </div>

            <SubmissionUploadForm slug={params.slug} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
