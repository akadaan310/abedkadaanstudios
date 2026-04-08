import type { CareerNode, PortfolioClient, ServiceTab } from '@/types/portfolio';

export const CAREER_NODES: CareerNode[] = [
  {
    year: '2006',
    company: 'Early Career',
    role: 'Building the foundation.',
  },
  {
    year: '2010',
    company: 'Fox',
    role: 'Engineering at one of the world\'s largest media companies.',
  },
  {
    year: '2014',
    company: 'ViacomCBS',
    role: 'Mobile development at scale. Products used by millions.',
  },
  {
    year: '2018',
    company: 'Emirates Airlines',
    role: 'Building the digital experience for a global premium brand.',
  },
  {
    year: 'Now',
    company: 'Independent',
    role: 'One engineer. The output of a team.',
    accent: true,
  },
];

export const PORTFOLIO_CLIENTS: PortfolioClient[] = [
  {
    name: 'Emirates',
    category: 'Aviation',
    badge: 'iOS · Android',
    tagline: 'Reimagined How 60M Passengers Travel',
    href: 'https://apps.apple.com/app/emirates/id549498496',
    bgFrom: '#CC0000',
    bgTo: '#6B0000',
    logoColor: 'white',
  },
  {
    name: 'Disney+',
    category: 'Streaming',
    badge: 'Full-Stack · Web',
    tagline: 'Built the Streaming Experience',
    href: 'https://disneyplus.com',
    bgFrom: '#001F5C',
    bgTo: '#0A1628',
    logoColor: 'white',
  },
  {
    name: 'Pluto TV',
    category: 'Streaming',
    badge: 'iOS · Android',
    tagline: 'Engineered Free TV for Millions',
    href: 'https://apps.apple.com/app/pluto-tv/id751712884',
    bgFrom: '#FFB800',
    bgTo: '#FF6B00',
    logoColor: 'dark',
  },
  {
    name: 'SkiDubai',
    category: 'Leisure',
    badge: 'Full-Stack · Web',
    tagline: 'Brought the Mountain Online',
    href: 'https://skidxb.com',
    bgFrom: '#0099CC',
    bgTo: '#003B6F',
    logoColor: 'white',
  },
  {
    name: 'Home Depot',
    category: 'Retail',
    badge: 'iOS · Android',
    tagline: 'Scaled Their Mobile Commerce',
    href: 'https://apps.apple.com/app/the-home-depot/id342527639',
    bgFrom: '#F96302',
    bgTo: '#C44A00',
    logoColor: 'white',
  },
];

export const SERVICE_TABS: ServiceTab[] = [
  {
    id: 'fullstack',
    filename: 'full-stack.ts',
    lang: 'ts',
    code: `// Full-Stack Web Development
// I build everything — the page you see and the engine behind it.

const yourWebsite = await build({
  design:   "Your brand, pixel-perfect on every screen",
  logic:    "Bookings, payments, user accounts — all handled",
  database: "Your data, structured and secure",
  domain:   "yourbusiness.com — live",
});

// One engineer. No handoffs. No agency markup.
export default yourWebsite;`,
  },
  {
    id: 'mobile',
    filename: 'mobile.tsx',
    lang: 'tsx',
    code: `// Mobile App Development · iOS & Android
// Your business, in every customer's pocket.

function YourApp() {
  return (
    <Screen>
      <YourBranding />
      <BookingFlow onComplete={() => notifyYou()} />
      <CustomerReviews rating={4.9} />
    </Screen>
  );
}

// Shipped to App Store + Google Play. One codebase. Both platforms.`,
  },
  {
    id: 'backend',
    filename: 'backend.ts',
    lang: 'ts',
    code: `// Backend & APIs
// The engine running silently behind your product.

async function whenCustomerOrders(order: Order) {
  await charge(order.card);       // Payment collected instantly
  await notify(order.customer);   // Confirmation sent automatically
  await alert(you, "New order");  // You hear about it in real time
  await archive(order);           // Every record kept, forever
}

// Handles thousands of requests. Never crashes.
export const uptime = "always on";`,
  },
  {
    id: 'landing',
    filename: 'landing-page.tsx',
    lang: 'tsx',
    code: `// Landing Pages — Built to Convert
// One page that turns visitors into paying customers.

export default function YourPage() {
  return (
    <Page>
      <Hero headline="The line that makes them stay" />
      <Services what={youOffer} />
      <Reviews stars={yourGoogleRating} />
      <ContactForm onSubmit={sendYouTheLead} />
    </Page>
  );
}
// Live in 48 hours. Optimized for Google from day one.`,
  },
];
