CREATE TABLE public.soulmate_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  age integer,
  gender text,
  seeking text,
  country_code text NOT NULL DEFAULT 'GH',
  interests text,
  personal_values text,
  partner_preferences text,
  about text,
  show_age boolean NOT NULL DEFAULT true,
  show_gender boolean NOT NULL DEFAULT true,
  show_interests boolean NOT NULL DEFAULT true,
  show_values boolean NOT NULL DEFAULT true,
  show_preferences boolean NOT NULL DEFAULT false,
  show_about boolean NOT NULL DEFAULT true,
  visibility text NOT NULL DEFAULT 'members' CHECK (visibility IN ('everyone','members','hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soulmate_profiles TO authenticated;
GRANT ALL ON public.soulmate_profiles TO service_role;
ALTER TABLE public.soulmate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_all" ON public.soulmate_profiles FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_soulmate_profiles_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER soulmate_profiles_updated_at BEFORE UPDATE ON public.soulmate_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_soulmate_profiles_updated_at();

-- Privacy-respecting directory: only returns fields the owner chose to show, to the audience they chose
CREATE OR REPLACE FUNCTION public.get_soulmate_directory(_country text)
RETURNS TABLE (user_id uuid, display_name text, age integer, gender text, seeking text,
  interests text, personal_values text, partner_preferences text, about text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.display_name,
    CASE WHEN p.show_age THEN p.age END,
    CASE WHEN p.show_gender THEN p.gender END,
    CASE WHEN p.show_gender THEN p.seeking END,
    CASE WHEN p.show_interests THEN p.interests END,
    CASE WHEN p.show_values THEN p.personal_values END,
    CASE WHEN p.show_preferences THEN p.partner_preferences END,
    CASE WHEN p.show_about THEN p.about END
  FROM public.soulmate_profiles p
  WHERE p.country_code = _country
    AND p.user_id IS DISTINCT FROM auth.uid()
    AND (p.visibility = 'everyone' OR (p.visibility = 'members' AND auth.uid() IS NOT NULL))
  ORDER BY p.updated_at DESC
  LIMIT 60
$$;
REVOKE ALL ON FUNCTION public.get_soulmate_directory(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_soulmate_directory(text) TO anon, authenticated;