DROP POLICY IF EXISTS profiles_read ON public.profiles;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS messages_read ON public.messages;
CREATE POLICY messages_read_members ON public.messages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS soulmate_posts_public_read ON public.soulmate_posts;
CREATE POLICY soulmate_posts_members_read ON public.soulmate_posts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.soulmate_posts FROM anon;

REVOKE SELECT ON public.relative_posts FROM anon;
GRANT SELECT (id, author_id, full_name, relation, last_seen, details, country_code, created_at) ON public.relative_posts TO anon;