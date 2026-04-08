-- ============================================================
-- leads
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id   TEXT UNIQUE NOT NULL,
  google_maps_url   TEXT,
  name              TEXT,
  address           JSONB,
  phone             TEXT,
  category          TEXT,
  location_query    TEXT,
  rating            NUMERIC(2,1),
  review_count      INTEGER DEFAULT 0,
  image_count       INTEGER DEFAULT 0,
  hours             JSONB,
  reviews_raw       JSONB,
  score_label       TEXT CHECK (score_label IN ('cold', 'warm', 'hot')),
  status            TEXT CHECK (status IN ('new', 'not_interested', 'emailed', 'purchased')) DEFAULT 'new',
  notes             TEXT,
  purchased_domain  TEXT,
  discovered_at     TIMESTAMPTZ DEFAULT NOW(),
  prepared_at       TIMESTAMPTZ,
  sold_at           TIMESTAMPTZ
);

-- ============================================================
-- businesses
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id              UUID REFERENCES leads(id) UNIQUE NOT NULL,
  name                 TEXT,
  slug                 TEXT UNIQUE NOT NULL,
  category             TEXT,
  phone                TEXT,
  address              JSONB,
  hours                JSONB,
  -- Claude copy fields
  hero_headline        TEXT,
  hero_subheadline     TEXT,
  about_text           TEXT,
  services             JSONB,
  cta_tagline          TEXT,
  seo_title            TEXT,
  seo_description      TEXT,
  seo_keywords         TEXT[],
  -- reviews & photos
  reviews              JSONB NOT NULL,
  photo_hero           TEXT,
  photos_gallery       TEXT[] DEFAULT ARRAY[]::TEXT[],
  photos_ai_generated  BOOLEAN DEFAULT FALSE,
  -- color system
  color_system         JSONB NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- site_leads
-- ============================================================
CREATE TABLE IF NOT EXISTS site_leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID REFERENCES businesses(id),
  first_name   TEXT NOT NULL,
  phone        TEXT NOT NULL,
  message      TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- custom_domains
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_domains (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID REFERENCES businesses(id),
  domain       TEXT UNIQUE NOT NULL,
  verified     BOOLEAN DEFAULT FALSE,
  added_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_status        ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score_label   ON leads(score_label);
CREATE INDEX IF NOT EXISTS idx_leads_discovered_at ON leads(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_review_count  ON leads(review_count DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_slug     ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);

-- ============================================================
-- migrations
-- ============================================================
ALTER TABLE businesses ALTER COLUMN services TYPE JSONB USING services::JSONB;

-- ============================================================
-- storage bucket + policies
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-photos', 'business-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-photos');

CREATE POLICY "Service role insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-photos');
