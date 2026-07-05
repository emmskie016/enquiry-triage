import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Read-side endpoint for the Retell voice agent: returns the most recent
// enquiry in a shape the agent can read back to the caller. Gated by a shared
// secret so enquirer details are not publicly readable.
export async function GET(req: Request) {
  const token = process.env.LATEST_ENQUIRY_TOKEN;
  if (!token || req.headers.get("x-api-key") !== token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const { data, error } = await getSupabase()
      .from("enquiries")
      .select("name, intent, property_address, budget, urgency, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ ok: true, enquiry: null, spoken: "There are no enquiries on file yet." });
    }

    const e = data[0];
    const parts = [
      `The latest enquiry is from ${e.name ?? "an unknown contact"}.`,
      `Intent: ${e.intent}.`,
      e.property_address ? `Property: ${e.property_address}.` : null,
      e.budget ? `Budget: ${e.budget}.` : null,
      `Urgency: ${e.urgency}.`,
      `Summary: ${e.summary}`,
    ].filter(Boolean);

    return NextResponse.json({ ok: true, enquiry: e, spoken: parts.join(" ") });
  } catch {
    return NextResponse.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}
