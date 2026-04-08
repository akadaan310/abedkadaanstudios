export interface ApifyPlace {
  placeId: string;
  title: string;
  url: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  totalScore: number;
  reviewsCount: number;
  imageCount: number;
  images?: Array<{ imageUrl: string }>;
  imageUrls?: string[];
  website: string;
  openingHours: Array<{ day: string; hours: string }> | null;
}

export interface ApifyReview {
  name: string;
  stars: number;
  text: string;
  publishedAtDate: string;
  reviewerPhotoUrl?: string | null;
}

export interface Review {
  reviewer: string;
  stars: number;
  text: string;
  date: string;
  reviewerPhotoUrl?: string | null;
}

export interface Lead {
  id: string;
  google_place_id: string;
  google_maps_url: string | null;
  name: string | null;
  address: { street: string; city: string; state: string; zip: string } | null;
  phone: string | null;
  category: string | null;
  location_query: string | null;
  rating: number | null;
  review_count: number;
  image_count: number;
  hours: Record<string, string> | null;
  reviews_raw: Review[] | null;
  score_label: import("./dashboard").ScoreLabel | null;
  status: import("./dashboard").LeadStatus;
  notes: string | null;
  purchased_domain: string | null;
  contact_email: string | null;
  discovered_at: string;
  prepared_at: string | null;
  sold_at: string | null;
  // populated via join in dashboard queries
  business_slug?: string;
}
