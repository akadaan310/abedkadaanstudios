export interface CareerNode {
  year: string;
  company: string;
  role: string;
  accent?: boolean;
}

export interface PortfolioClient {
  name: string;
  category: string;
  badge: string;
  tagline: string;
  href: string;
  bgFrom: string;
  bgTo: string;
  logoColor: 'white' | 'dark';
}

export interface ServiceTab {
  id: string;
  filename: string;
  lang: 'ts' | 'tsx';
  code: string;
}
