import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ContestForm } from '../ContestForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Новый контест — AIAG Admin' };

export default function NewContestPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Новый контест</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Параметры</CardTitle>
        </CardHeader>
        <CardContent>
          <ContestForm />
        </CardContent>
      </Card>
    </div>
  );
}
