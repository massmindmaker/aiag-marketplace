'use client';

import { useState } from 'react';
import { Send, Check } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';

type Modality = 'chat' | 'image' | 'video' | 'audio' | 'embedding';
type Outbound = 'cloud-api' | 'hosted-on-aiag';
type PiiRisk = 'low' | 'medium' | 'high';

const MODALITIES: Modality[] = ['chat', 'image', 'video', 'audio', 'embedding'];
const RISKS: PiiRisk[] = ['low', 'medium', 'high'];

export default function SubmitModelPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [modality, setModality] = useState<Modality>('chat');
  const [description, setDescription] = useState('');

  // Step 2
  const [outboundKind, setOutboundKind] = useState<Outbound>('cloud-api');
  const [upstreamUrl, setUpstreamUrl] = useState('');
  const [pricingNote, setPricingNote] = useState('');

  // Step 3
  const [ruResidency, setRuResidency] = useState(false);
  const [piiRisk, setPiiRisk] = useState<PiiRisk>('low');
  const [gdprApplicable, setGdprApplicable] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  function step1Valid() {
    return (
      name.trim().length >= 2 &&
      /^[a-z0-9-]+$/.test(slug) &&
      slug.length >= 2 &&
      description.trim().length >= 20
    );
  }
  function step2Valid() {
    if (outboundKind === 'cloud-api')
      return /^https?:\/\//.test(upstreamUrl.trim());
    return true;
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/me/submit-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          modality,
          description: description.trim(),
          outboundKind,
          upstreamUrl: upstreamUrl.trim() || null,
          pricing: pricingNote ? { note: pricingNote.trim() } : {},
          ruResidency,
          piiRisk,
          gdprApplicable,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === 'validation_failed'
            ? data.issues?.map((i: { message: string }) => i.message).join('; ')
            : data.error || `HTTP ${res.status}`,
        );
        return;
      }
      setSubmittedId(data.submission?.id || 'sent');
      setStep(4);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MainLayout>
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Подать модель</h1>
          <p className="text-muted-foreground mt-1">
            Заявка на добавление вашей модели в каталог AIAG. Шаги 1–3, затем отправка на модерацию.
          </p>
        </header>

        <div className="flex items-center gap-2 mb-6 text-xs">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <Badge
                variant={step >= n ? 'default' : 'secondary'}
                className={
                  step >= n
                    ? 'bg-primary text-primary-foreground'
                    : ''
                }
              >
                Шаг {n}
              </Badge>
              {n < 4 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Базовая информация</h2>
                <div>
                  <Label htmlFor="name">Название</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Llama 3.1 70B Custom"
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (a-z, 0-9, "-")</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    placeholder="llama-3-70b-custom"
                  />
                </div>
                <div>
                  <Label>Модальность</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {MODALITIES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModality(m)}
                        className={
                          'px-3 py-1 rounded-full border text-sm transition-colors ' +
                          (modality === m
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/40')
                        }
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="desc">Описание (RU, минимум 20 символов)</Label>
                  <textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={4000}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Интеграция</h2>
                <div>
                  <Label>Тип интеграции</Label>
                  <div className="flex gap-2 mt-1">
                    {(['cloud-api', 'hosted-on-aiag'] as Outbound[]).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOutboundKind(o)}
                        className={
                          'px-3 py-1 rounded-full border text-sm transition-colors ' +
                          (outboundKind === o
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/40')
                        }
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                {outboundKind === 'cloud-api' && (
                  <div>
                    <Label htmlFor="up">Upstream URL</Label>
                    <Input
                      id="up"
                      value={upstreamUrl}
                      onChange={(e) => setUpstreamUrl(e.target.value)}
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="price">Предложение по ценообразованию (текст)</Label>
                  <textarea
                    id="price"
                    value={pricingNote}
                    onChange={(e) => setPricingNote(e.target.value)}
                    rows={3}
                    placeholder="например, 0.05 USD / 1k input + 0.10 USD / 1k output"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Compliance</h2>
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <Label htmlFor="ru" className="cursor-pointer">
                    RU-резидентность данных
                  </Label>
                  <Switch
                    id="ru"
                    checked={ruResidency}
                    onCheckedChange={setRuResidency}
                  />
                </div>
                <div>
                  <Label>Уровень риска PII</Label>
                  <div className="flex gap-2 mt-1">
                    {RISKS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setPiiRisk(r)}
                        className={
                          'px-3 py-1 rounded-full border text-sm transition-colors ' +
                          (piiRisk === r
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/40')
                        }
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <Label htmlFor="gdpr" className="cursor-pointer">
                    Применима GDPR (есть пользователи в ЕС)
                  </Label>
                  <Switch
                    id="gdpr"
                    checked={gdprApplicable}
                    onCheckedChange={setGdprApplicable}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center">
                  <Check className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">Заявка отправлена</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  ID: <span className="font-mono">{submittedId}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Мы рассмотрим заявку и свяжемся с вами по email.
                </p>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {step !== 4 && (
              <div className="flex justify-between mt-6">
                <Button
                  variant="ghost"
                  disabled={step === 1}
                  onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                >
                  Назад
                </Button>
                {step < 3 && (
                  <Button
                    onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                    disabled={(step === 1 && !step1Valid()) || (step === 2 && !step2Valid())}
                  >
                    Далее
                  </Button>
                )}
                {step === 3 && (
                  <Button
                    leftIcon={<Send className="h-4 w-4" />}
                    onClick={submit}
                    disabled={submitting}
                  >
                    {submitting ? 'Отправка…' : 'Отправить на модерацию'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </MainLayout>
  );
}
