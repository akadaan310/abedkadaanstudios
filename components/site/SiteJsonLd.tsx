import type { Business } from '@/types/business';

interface Props {
  business: Business;
}

const DAY_NORMALIZE: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

/**
 * Converts "8am–6pm", "8:30AM–5:00PM", "9 AM – 5 PM" etc. to
 * { opens: "08:00", closes: "18:00" } in 24-hour format.
 * Returns null if the string can't be parsed.
 */
function parseTimeRange(str: string): { opens: string; closes: string } | null {
  // Split on en-dash, em-dash, or hyphen (with optional surrounding spaces)
  const parts = str.split(/\s*[–—\-]\s*/);
  if (parts.length < 2) return null;

  const opens = parseTime(parts[0].trim());
  const closes = parseTime(parts[1].trim());
  if (!opens || !closes) return null;

  return { opens, closes };
}

function parseTime(raw: string): string | null {
  // Match: optional leading digit(s), optional colon+minutes, then AM/PM
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hours !== 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function SiteJsonLd({ business }: Props) {
  const address = business.address
    ? {
        '@type': 'PostalAddress',
        streetAddress: business.address.street,
        addressLocality: business.address.city,
        addressRegion: business.address.state,
        postalCode: business.address.zip,
        addressCountry: 'US',
      }
    : undefined;

  // Normalize either DB format: Record<string,string> or legacy array [{day,hours}]
  const hoursRecord: Record<string, string> = (() => {
    if (!business.hours) return {};
    if (Array.isArray(business.hours)) {
      const rec: Record<string, string> = {};
      for (const item of business.hours as Array<{ day?: string; hours?: string }>) {
        if (item?.day) rec[item.day] = item.hours ?? '';
      }
      return rec;
    }
    return business.hours as Record<string, string>;
  })();

  const openingHoursSpecification =
    Object.keys(hoursRecord).length
      ? Object.entries(hoursRecord).flatMap(([rawDay, value]) => {
          if (typeof value !== 'string' || value.toLowerCase() === 'closed') return [];
          const day = DAY_NORMALIZE[rawDay.toLowerCase()];
          if (!day) return [];
          const times = parseTimeRange(value);
          if (!times) return [];
          return [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: `https://schema.org/${day}`,
              opens: times.opens,
              closes: times.closes,
            },
          ];
        })
      : undefined;

  const aggregateRating =
    business.lead?.rating != null && business.lead?.review_count
      ? {
          '@type': 'AggregateRating',
          ratingValue: business.lead.rating,
          reviewCount: business.lead.review_count,
        }
      : undefined;

  const reviews = (business.reviews ?? []).slice(0, 5).map((r) => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.reviewer },
    reviewRating: { '@type': 'Rating', ratingValue: r.stars, bestRating: 5 },
    reviewBody: r.text,
  }));

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    ...(business.phone != null && { telephone: business.phone }),
    ...(address && { address }),
    ...(openingHoursSpecification?.length && { openingHoursSpecification }),
    ...(aggregateRating && { aggregateRating }),
    ...(reviews.length && { review: reviews }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
