
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  phone TEXT,
  display_name TEXT,
  country_code TEXT NOT NULL DEFAULT 'GH',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_articles TO anon;
GRANT SELECT ON public.news_articles TO authenticated;
GRANT ALL ON public.news_articles TO service_role;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_public_read" ON public.news_articles FOR SELECT USING (true);

CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition TEXT NOT NULL,
  country_code TEXT NOT NULL,
  home_team TEXT NOT NULL,
  home_code TEXT NOT NULL,
  away_team TEXT NOT NULL,
  away_code TEXT NOT NULL,
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  minute INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'live',
  kickoff_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.matches TO anon;
GRANT SELECT ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_public_read" ON public.matches FOR SELECT USING (true);

CREATE TABLE public.match_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches ON DELETE CASCADE,
  minute INT NOT NULL,
  player TEXT NOT NULL,
  team TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'goal'
);
GRANT SELECT ON public.match_events TO anon;
GRANT SELECT ON public.match_events TO authenticated;
GRANT ALL ON public.match_events TO service_role;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_events_public_read" ON public.match_events FOR SELECT USING (true);

CREATE TABLE public.relative_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  relation TEXT,
  last_seen TEXT,
  details TEXT,
  contact_phone TEXT,
  country_code TEXT NOT NULL DEFAULT 'GH',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.relative_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relative_posts TO authenticated;
GRANT ALL ON public.relative_posts TO service_role;
ALTER TABLE public.relative_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "relative_posts_public_read" ON public.relative_posts FOR SELECT USING (true);
CREATE POLICY "relative_posts_insert_own" ON public.relative_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "relative_posts_update_own" ON public.relative_posts FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "relative_posts_delete_own" ON public.relative_posts FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'sale',
  title TEXT NOT NULL,
  detail TEXT,
  price_text TEXT,
  location TEXT,
  country_code TEXT NOT NULL DEFAULT 'GH',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_public_read" ON public.listings FOR SELECT USING (true);
CREATE POLICY "listings_insert_own" ON public.listings FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "listings_update_own" ON public.listings FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "listings_delete_own" ON public.listings FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  author_name TEXT,
  channel TEXT NOT NULL DEFAULT 'GH',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_read" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "messages_delete_own" ON public.messages FOR DELETE TO authenticated USING (author_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

INSERT INTO public.news_articles (country_code, category, title, summary, source, published_at) VALUES
('GH','Markets','Cedi steadies after week of cocoa export gains','Traders in Accra report calmer rates as cocoa shipments clear the Tema port backlog.','Daily Graphic', now() - interval '2 hours'),
('GH','Transport','New Accra–Kumasi express buses start Monday','Operators add 40 seats per trip on the busiest weekend routes.','Citi News', now() - interval '5 hours'),
('GH','Health','Tamale clinic opens night shift for mothers','Extra nurses join the evening roster after a year of daytime-only care.','GBC', now() - interval '9 hours'),
('NG','Markets','Fuel reform moves the naira by 3.2% this week','Lagos analysts expect the swing to settle once subsidy notices are published.','Punch', now() - interval '1 hour'),
('NG','Agriculture','Eko farms hit record tomato yield as exports rise','Cold storage upgrades in Ikorodu cut post-harvest losses by a third.','Guardian NG', now() - interval '6 hours'),
('KE','Technology','Nairobi startups raise fresh funding round','Three fintech firms close deals aimed at cross-border payments.','Daily Nation', now() - interval '3 hours'),
('KE','Weather','Long rains forecast for the Rift Valley','Farmers are advised to plant early maize varieties this season.','KBC', now() - interval '7 hours'),
('ZA','Energy','Grid holds steady through third week without cuts','Maintenance at two stations finished ahead of schedule.','News24', now() - interval '4 hours'),
('ZA','Sport','Soweto derby tickets sell out in two hours','Organisers open a second ticket window for members on Friday.','SABC', now() - interval '8 hours'),
('BW','Community','Gaborone market traders get new stalls','The council rebuilt the east row after last season closure.','Mmegi', now() - interval '2 hours'),
('BW','Jobs','Mining firm opens 120 apprentice places','Applications close at the end of the month for school leavers.','Botswana Guardian', now() - interval '10 hours');

WITH m AS (
  INSERT INTO public.matches (competition, country_code, home_team, home_code, away_team, away_code, home_score, away_score, minute, status) VALUES
  ('Africa Cup qualifier','GH','Ghana','GH','Nigeria','NG',1,1,78,'live'),
  ('Premier League GH','GH','Hearts of Oak','HOK','Asante Kotoko','KOT',2,0,64,'live'),
  ('NPFL','NG','Enyimba FC','ENY','Kano Pillars','KAN',2,1,67,'live'),
  ('Kenya Premier','KE','AFC Leopards','AFC','Gor Mahia','GOR',0,0,41,'live'),
  ('PSL','ZA','Orlando Pirates','ORL','Kaizer Chiefs','KAI',1,2,90,'finished')
  RETURNING id, home_code
)
INSERT INTO public.match_events (match_id, minute, player, team, kind)
SELECT id, 12, 'K. Owusu', 'Ghana', 'goal' FROM m WHERE home_code = 'GH'
UNION ALL SELECT id, 44, 'M. Ade', 'Nigeria', 'goal' FROM m WHERE home_code = 'GH'
UNION ALL SELECT id, 22, 'S. Mensah', 'Hearts of Oak', 'goal' FROM m WHERE home_code = 'HOK'
UNION ALL SELECT id, 58, 'A. Tetteh', 'Hearts of Oak', 'goal' FROM m WHERE home_code = 'HOK'
UNION ALL SELECT id, 23, 'C. Okafor', 'Enyimba FC', 'goal' FROM m WHERE home_code = 'ENY'
UNION ALL SELECT id, 74, 'C. Okafor', 'Enyimba FC', 'goal' FROM m WHERE home_code = 'ENY'
UNION ALL SELECT id, 51, 'B. Musa', 'Kano Pillars', 'goal' FROM m WHERE home_code = 'ENY'
UNION ALL SELECT id, 9, 'T. Dlamini', 'Orlando Pirates', 'goal' FROM m WHERE home_code = 'ORL'
UNION ALL SELECT id, 35, 'P. Khune', 'Kaizer Chiefs', 'goal' FROM m WHERE home_code = 'ORL'
UNION ALL SELECT id, 81, 'L. Radebe', 'Kaizer Chiefs', 'goal' FROM m WHERE home_code = 'ORL';

INSERT INTO public.relative_posts (full_name, relation, last_seen, details, contact_phone, country_code, created_at) VALUES
('Selorm Asante','Aunt','Tema, 1998','Left for trading in Lome and the family lost touch. Kumasi family looking.','+233 24 000 1122','GH', now() - interval '3 days'),
('Daniel Ofori','Brother','Takoradi, 1974','Born in Takoradi, raised in Aburi. Siblings want to reunite.','+233 20 445 7781','GH', now() - interval '6 days'),
('Ada Obi','Daughter','Oshodi market, Lagos','Last seen near the market on a Monday morning. Any news welcome.','+234 803 112 9921','NG', now() - interval '1 day'),
('Mpho Kgosi','Cousin','Francistown, 2011','Moved for work and stopped calling home. Family in Gaborone searching.','+267 71 223 445','BW', now() - interval '2 days'),
('Wanjiru Kamau','Mother','Nakuru, 2005','Separated during a move to Nairobi. Children now grown and looking.','+254 722 334 556','KE', now() - interval '5 days');

INSERT INTO public.listings (kind, title, detail, price_text, location, country_code, created_at) VALUES
('job','Barista (part-time)','Weekend shifts, training provided. Cocoa Roast Co.','GHS 1,400/mo','Accra','GH', now() - interval '4 hours'),
('sale','Refurbished Toyota Corolla ''16','Full service history, new tyres.','GHS 82,000','Kumasi','GH', now() - interval '1 day'),
('job','Delivery van driver','Clean licence required, six-day week.','GHS 1,800/mo','Accra','GH', now() - interval '2 days'),
('sale','Woven market baskets','Handmade, bulk orders welcome.','GHS 90 each','Bolgatanga','GH', now() - interval '3 days'),
('job','Data analyst (remote)','SQL and spreadsheets, start immediately.','NGN 350,000/mo','Lagos','NG', now() - interval '5 hours'),
('sale','Fresh brownies, baked daily','Order by 10am for same-day pickup.','NGN 4,500','Surulere','NG', now() - interval '8 hours'),
('job','Shop assistant','Retail experience preferred.','KES 32,000/mo','Nairobi','KE', now() - interval '1 day'),
('sale','Second-hand fridge, working','Collected from Gaborone west only.','BWP 1,200','Gaborone','BW', now() - interval '2 days');
