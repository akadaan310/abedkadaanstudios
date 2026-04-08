export interface BusinessCopy {
  hero_headline: string;
  hero_subheadline: string;
  about_text: string;
  services: Array<{ name: string; icon: string; description: string }>;
  cta_tagline: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  hero_image_prompt: string;
  gallery_image_prompt: string;
}

export interface ColorSystem {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textLight: string;
}

export interface Business {
  id: string;
  lead_id: string;
  name: string | null;
  slug: string;
  category: string | null;
  phone: string | null;
  address: { street: string; city: string; state: string; zip: string } | null;
  hours: Record<string, string> | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  about_text: string | null;
  services: Array<{ name: string; icon: string; description: string }> | null;
  cta_tagline: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  reviews: import("./lead").Review[];
  photo_hero: string | null;
  photos_gallery: string[];
  photos_ai_generated: boolean;
  hide_gallery: boolean;
  color_system: ColorSystem;
  created_at: string;
  // populated via join
  lead?: { rating: number | null; review_count: number } | null;
}
