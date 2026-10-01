import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const recommendSoulmates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { rankMatches, GatewayError } = await import("./soulmate-ai.server");
    const sb = context.supabase;
    const { data: me } = await sb
      .from("soulmate_profiles" as never)
      .select("display_name, age, gender, seeking, country_code, interests, personal_values, partner_preferences, about")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!me) return { error: "Create your Soulmate profile first.", matches: [] };
    const profile = me as Record<string, unknown> & { country_code: string };
    const { data: dir } = await sb.rpc("get_soulmate_directory" as never, { _country: profile.country_code } as never);
    const candidates = ((dir ?? []) as never[]).slice(0, 40) as Parameters<typeof rankMatches>[1];
    if (candidates.length === 0) return { error: null, matches: [] };
    try {
      const { country_code: _c, ...mine } = profile;
      const ranked = await rankMatches(mine as never, candidates);
      return {
        error: null,
        matches: ranked.map((r) => ({ ...r, profile: candidates.find((c) => c.user_id === r.user_id)! })),
      };
    } catch (e) {
      return { error: e instanceof GatewayError ? e.message : "Couldn't find matches right now.", matches: [] };
    }
  });
