CREATE TABLE public.soulmate_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  age integer,
  gender text,
  seeking text,
  about text,
  country_code text NOT NULL DEFAULT 'GH',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.soulmate_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soulmate_posts TO authenticated;
GRANT ALL ON public.soulmate_posts TO service_role;
ALTER TABLE public.soulmate_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soulmate_posts_public_read" ON public.soulmate_posts FOR SELECT USING (true);
CREATE POLICY "soulmate_posts_insert_own" ON public.soulmate_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "soulmate_posts_update_own" ON public.soulmate_posts FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "soulmate_posts_delete_own" ON public.soulmate_posts FOR DELETE TO authenticated USING (author_id = auth.uid());