import Link from 'next/link';
import { ArrowRight, Zap, Shield, Code, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">AIAG</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/marketplace" className="text-sm font-medium hover:text-primary">
              Marketplace
            </Link>
            <Link href="/docs" className="text-sm font-medium hover:text-primary">
              Documentation
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-medium hover:text-primary"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center justify-center space-y-8 py-24 text-center md:py-32">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            AI Models{' '}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Marketplace
            </span>
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Access hundreds of AI models through a single API. LLM, image generation,
            audio processing, video analysis and more.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Explore Models
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            View Documentation
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container py-24">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Fast Integration</h3>
            <p className="text-sm text-muted-foreground">
              Single API for all AI models. Start in minutes.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Secure & Reliable</h3>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade security and 99.9% uptime.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Developer Friendly</h3>
            <p className="text-sm text-muted-foreground">
              SDKs for all major languages and frameworks.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Usage Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring and detailed analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Model Types */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              All Types of AI Models
            </h2>
            <p className="mt-4 text-muted-foreground">
              From text generation to video processing - find the right model for your task.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'LLM',
                description: 'Text generation, chat, summarization, translation',
                count: '50+',
              },
              {
                title: 'Image',
                description: 'Generation, editing, upscaling, recognition',
                count: '30+',
              },
              {
                title: 'Audio',
                description: 'Speech-to-text, text-to-speech, music generation',
                count: '20+',
              },
              {
                title: 'Video',
                description: 'Generation, analysis, editing, captioning',
                count: '15+',
              },
              {
                title: 'Embeddings',
                description: 'Text and image embeddings for search and RAG',
                count: '10+',
              },
              {
                title: 'Code',
                description: 'Code generation, review, refactoring',
                count: '10+',
              },
            ].map((type) => (
              <div
                key={type.title}
                className="group rounded-lg border bg-background p-6 transition-colors hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{type.title}</h3>
                  <span className="text-sm text-muted-foreground">{type.count} models</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Create a free account and start using AI models in minutes.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            2024 AIAG. All rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
              Docs
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
