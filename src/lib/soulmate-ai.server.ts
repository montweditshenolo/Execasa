import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export type Candidate = {
  user_id: string;
  display_name: string;
  age: number | null;
  gender: string | null;
  seeking: string | null;
  interests: string | null;
  personal_values: string | null;
  partner_preferences: string | null;
  about: string | null;
};

export type Match = { user_id: string; score: number; reasons: string[] };

export class GatewayError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function rankMatches(me: Omit<Candidate, "user_id">, candidates: Candidate[]): Promise<Match[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new GatewayError("AI matching isn't configured yet.", 401);

  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const list = candidates.map((c, i) => ({ id: `c${i}`, ...c, user_id: undefined }));
  const prompt = `You are a thoughtful, respectful matchmaker for a dating community.
Rank up to 5 of the candidates below by compatibility with the member. Consider shared interests, aligned values, and whether each person fits the other's stated preferences and "seeking" gender. Only use details given; never invent facts. Skip clearly incompatible people.
For each pick give a score 0-100 and 2-3 short, warm, specific reasons (max 20 words each) that cite the shared details.
Reply with ONLY JSON: {"matches":[{"id":"c0","score":87,"reasons":["..."]}]}

MEMBER:
${JSON.stringify(me)}

CANDIDATES:
${JSON.stringify(list)}`;

  let text: string;
  try {
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      prompt,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    text = await result.text;
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode ?? 500;
    if (status === 429) throw new GatewayError("Lots of people are matching right now. Try again in a minute.", 429);
    if (status === 402) throw new GatewayError("AI credits have run out. Please add credits to keep matching.", 402);
    if (status === 403) throw new GatewayError("AI matching isn't available right now.", 403);
    throw new GatewayError("Couldn't find matches right now. Please try again.", status);
  }

  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  let parsed: { matches?: { id?: string; score?: number; reasons?: unknown }[] } = {};
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  const out: Match[] = [];
  for (const m of parsed.matches ?? []) {
    const idx = Number(String(m.id ?? "").replace("c", ""));
    const c = candidates[idx];
    if (!c || out.some((o) => o.user_id === c.user_id)) continue;
    const reasons = Array.isArray(m.reasons) ? m.reasons.filter((r): r is string => typeof r === "string").slice(0, 3) : [];
    out.push({ user_id: c.user_id, score: Math.max(0, Math.min(100, Math.round(Number(m.score) || 0))), reasons });
  }
  return out.slice(0, 5);
}
