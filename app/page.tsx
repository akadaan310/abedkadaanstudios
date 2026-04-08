import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import PortfolioPage from '@/components/portfolio/PortfolioPage';
import { resolveBusinessFromRequest } from '@/lib/resolve-business';
import { SiteNav } from '@/components/site/SiteNav';
import { SiteHero } from '@/components/site/SiteHero';
import { SiteServices } from '@/components/site/SiteServices';
import { SiteAbout } from '@/components/site/SiteAbout';
import { SiteReviewsCarousel } from '@/components/site/SiteReviewsCarousel';
import { SiteLeadForm } from '@/components/site/SiteLeadForm';
import { SiteGallery } from '@/components/site/SiteGallery';
import { SiteContact } from '@/components/site/SiteContact';
import { SiteJsonLd } from '@/components/site/SiteJsonLd';
import { SiteFooter } from '@/components/site/SiteFooter';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const siteType = headersList.get('x-site-type');
  if (siteType === 'portfolio') {
    return {
      title: 'Abed Kadaan — Full-Stack & Mobile Developer',
      description: 'Over 18 years building digital products for Fox, ViacomCBS, and Emirates Airlines. Now independent.',
      openGraph: {
        title: 'Abed Kadaan — Full-Stack & Mobile Developer',
        url: 'https://abedkadaan.com',
        siteName: 'Abed Kadaan',
        type: 'website',
      },
    };
  }

  const business = await resolveBusinessFromRequest();
  if (!business) return {};

  // Check for a verified custom domain to use as canonical
  const supabase = createClient();
  const { data: domainRow } = await supabase
    .from('custom_domains')
    .select('domain')
    .eq('business_id', business.id)
    .eq('verified', true)
    .maybeSingle();

  const canonical = domainRow?.domain
    ? `https://${domainRow.domain}`
    : `https://${business.slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN}`;

  const city = business.address?.city ?? '';
  const state = business.address?.state ?? '';

  return {
    title: business.seo_title ?? undefined,
    description: business.seo_description ?? undefined,
    keywords: business.seo_keywords?.join(', ') ?? undefined,
    alternates: {
      canonical,
    },
    openGraph: {
      title: business.seo_title ?? undefined,
      description: business.seo_description ?? undefined,
      url: canonical,
      siteName: business.name ?? undefined,
      images: business.photo_hero
        ? [{ url: business.photo_hero, width: 1200, height: 630 }]
        : [],
      type: 'website',
      locale: 'en_US',
    },
    other: {
      ...(state && { 'geo.region': `US-${state}` }),
      ...(city && { 'geo.placename': city }),
    },
  };
}

export default async function Page() {
  const headersList = await headers();
  const siteType = headersList.get('x-site-type');
  if (siteType === 'portfolio') {
    return <PortfolioPage />;
  }

  const business = await resolveBusinessFromRequest();

  if (!business) {
    return (
      <div className="p-8 text-center">Business not found.</div>
    );
  }

  const cs = business.color_system;

  const cssVars = {
    '--color-primary': cs.primary,
    '--color-secondary': cs.secondary,
    '--color-accent': cs.accent,
    '--color-background': cs.background,
    '--color-surface': cs.surface,
    '--color-text': cs.text,
    '--color-text-light': cs.textLight,
  } as React.CSSProperties;

  // Services may be stored as an array of JSON strings or parsed objects
  const services = (business.services ?? []).map((s) =>
    typeof s === 'string' ? JSON.parse(s) : s
  ) as Array<{ name: string; icon: string; description: string }>;

  return (
    <div
      style={cssVars}
      className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]"
    >
      <SiteJsonLd business={business} />

      <SiteNav
        name={business.name ?? ''}
        phone={business.phone}
      />

      <SiteHero
        photoHero={business.photo_hero}
        headline={business.hero_headline}
        subheadline={business.hero_subheadline}
        phone={business.phone}
        ctaTagline={business.cta_tagline}
      />

      <SiteServices services={services} />

      <SiteAbout
        text={business.about_text ?? ''}
        rating={business.lead?.rating ?? null}
        reviewCount={business.lead?.review_count ?? null}
      />

      <SiteReviewsCarousel reviews={business.reviews ?? []} />

      <SiteLeadForm
        cta={business.cta_tagline ?? 'Get in Touch'}
        businessId={business.id}
      />

      {!business.hide_gallery && (
        <SiteGallery
          photos={business.photos_gallery ?? []}
          city={business.address?.city ?? ''}
        />
      )}

      <SiteContact
        phone={business.phone}
        address={business.address}
        hours={business.hours}
      />

      <SiteFooter
        name={business.name ?? ''}
        phone={business.phone}
        subheadline={business.hero_subheadline ?? ''}
        address={business.address}
      />
    </div>
  );
}
