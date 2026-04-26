/**
 * Plan 08 Task 6 — Schema.org JSON-LD generators.
 *
 * Использование:
 *   <OrganizationSchema /> в root layout.tsx
 *   <SoftwareApplicationSchema model={m} /> на marketplace/[org]/[model]/page.tsx
 *   <ItemListSchema items={...} /> на marketplace/page.tsx
 *   <FaqPageSchema faqs={...} /> на compare + pricing
 */

function Json({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationSchema() {
  return (
    <Json
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'AI-Aggregator',
        url: 'https://ai-aggregator.ru',
        logo: 'https://ai-aggregator.ru/logo-512.png',
        sameAs: [
          'https://t.me/aiag_ru',
          'https://vk.com/aiaggregator',
        ],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            email: 'support@ai-aggregator.ru',
            contactType: 'customer support',
            availableLanguage: ['ru', 'en'],
          },
        ],
      }}
    />
  );
}

export function SoftwareApplicationSchema({
  model,
}: {
  model: {
    displayName: string;
    description?: string;
    priceInputPer1k?: number | null;
    ratingAvg?: number | null;
    ratingCount?: number | null;
    org?: string;
    slug?: string;
  };
}) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: model.displayName,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
  };
  if (model.description) data.description = model.description;
  if (model.priceInputPer1k != null) {
    data.offers = {
      '@type': 'Offer',
      price: model.priceInputPer1k,
      priceCurrency: 'RUB',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1000, unitText: 'tokens' },
      },
    };
  }
  if (model.ratingAvg != null && model.ratingCount) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: model.ratingAvg,
      reviewCount: model.ratingCount,
    };
  }
  return <Json data={data} />;
}

export function ItemListSchema({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  return (
    <Json
      data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: items.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          url: it.url,
        })),
      }}
    />
  );
}

export function FaqPageSchema({
  faqs,
}: {
  faqs: Array<{ q: string; a: string }>;
}) {
  return (
    <Json
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }}
    />
  );
}
