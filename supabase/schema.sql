-- ============================================
-- HOLD CMS — Supabase Schema
-- ============================================

-- Flexible key-value content for simple sections
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,       -- e.g. 'hero', 'about', 'cta', 'contact', 'support', 'mission'
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gallery images
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  src TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Programmes
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  image_alt TEXT DEFAULT '',
  is_flagship BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Other initiatives (simpler sub-items under programmes)
CREATE TABLE IF NOT EXISTS initiatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  highlights TEXT[] DEFAULT '{}',
  impact TEXT[] DEFAULT '{}',
  image TEXT NOT NULL DEFAULT '',
  image_alt TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  gallery JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stats counters
CREATE TABLE IF NOT EXISTS stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  value INT NOT NULL DEFAULT 0,
  suffix TEXT DEFAULT '',
  prefix TEXT DEFAULT '',
  duration INT DEFAULT 1200,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security but allow service role full access
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Public read policies (website can read without auth)
CREATE POLICY "Public read site_content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Public read team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public read gallery_images" ON gallery_images FOR SELECT USING (true);
CREATE POLICY "Public read programs" ON programs FOR SELECT USING (true);
CREATE POLICY "Public read initiatives" ON initiatives FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read stats" ON stats FOR SELECT USING (true);

-- Create storage bucket for website images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('website-images', 'website-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to storage
CREATE POLICY "Public read website-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'website-images');

-- Allow service role to upload
CREATE POLICY "Service upload website-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'website-images');

CREATE POLICY "Service update website-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'website-images');

CREATE POLICY "Service delete website-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'website-images');

-- Content history for undo/revert (used by /undo command)
CREATE TABLE IF NOT EXISTS content_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  previous_data JSONB NOT NULL,
  action_description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read content_history" ON content_history FOR SELECT USING (true);

-- Cookie consent analytics (used by /cookies command)
CREATE TABLE IF NOT EXISTS cookie_consent_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('accepted', 'declined')),
  user_agent TEXT DEFAULT '',
  country TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cookie_consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert cookie_consent_log" ON cookie_consent_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read cookie_consent_log" ON cookie_consent_log FOR SELECT USING (true);

-- ============================================
-- VOTING SYSTEM - ROOTS & WINGS AWARDS 2026
-- ============================================

-- Categories for voting
CREATE TABLE IF NOT EXISTS voting_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Votes cast
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_key TEXT NOT NULL REFERENCES voting_categories(key),
  nominee_name TEXT NOT NULL,
  voter_email TEXT NOT NULL,
  voter_ip TEXT NOT NULL DEFAULT '',
  voter_user_agent TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track verified emails to prevent duplicate voting
CREATE TABLE IF NOT EXISTS voter_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL DEFAULT '',
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  voted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE voting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_verifications ENABLE ROW LEVEL SECURITY;

-- Public can read categories
CREATE POLICY "Public read voting_categories" ON voting_categories FOR SELECT USING (true);

-- Public can insert votes (with verification)
CREATE POLICY "Public insert votes" ON votes FOR INSERT WITH CHECK (true);

-- Only service role can read votes (private results)
CREATE POLICY "Service read votes" ON votes FOR SELECT USING (false);

-- Public can insert verifications
CREATE POLICY "Public insert voter_verifications" ON voter_verifications FOR INSERT WITH CHECK (true);

-- Only service role can read/update verifications
CREATE POLICY "Service read voter_verifications" ON voter_verifications FOR SELECT USING (false);
CREATE POLICY "Service update voter_verifications" ON voter_verifications FOR UPDATE USING (false);

-- Insert voting categories for Roots & Wings 2026
INSERT INTO voting_categories (key, title, description, sort_order) VALUES
  ('community_father', 'Community Father Figure', 'A father who makes a positive impact in the community', 1),
  ('everyday_hero', 'Everyday Hero', 'Someone who performs small acts of kindness daily', 2),
  ('mentor_year', 'Mentor of the Year', 'An exceptional mentor who guides and inspires others', 3),
  ('resilient_man', 'Resilient Man', 'Someone who has overcome significant challenges', 4),
  ('always_there', 'The Man Who''s Always There', 'Someone consistently reliable and supportive', 5),
  ('young_role_model', 'Young Male Role Model', 'A young man who sets a positive example for his peers', 6)
ON CONFLICT (key) DO NOTHING;
