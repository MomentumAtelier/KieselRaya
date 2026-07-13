import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This route never runs during static generation — it's a Route Handler,
// which Next.js only ever executes per-request.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI suggestions aren't configured yet. Add ANTHROPIC_API_KEY as a server-side " +
          "environment variable (Vercel Project Settings -> Environment Variables) — never " +
          "with a NEXT_PUBLIC_ prefix, since that would ship it to the browser.",
      },
      { status: 501 }
    );
  }

  let body: { contactId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const contactId = body.contactId;
  if (!contactId) {
    return NextResponse.json({ error: "contactId is required." }, { status: 400 });
  }

  const supabase = createClient();

  // Respects RLS: this only ever returns data the signed-in user owns.
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("*, companies(name, industry)")
    .eq("id", contactId)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  const { data: activities } = await supabase
    .from("activities")
    .select("type, subject, description, activity_date")
    .eq("related_to_type", "contact")
    .eq("related_to_id", contactId)
    .order("activity_date", { ascending: false })
    .limit(8);

  const companyName =
    (contact as unknown as { companies: { name: string; industry: string | null } | null })
      .companies?.name ?? null;

  const profileLines = [
    `Name: ${contact.first_name} ${contact.last_name ?? ""}`.trim(),
    contact.title ? `Title: ${contact.title}` : null,
    companyName ? `Company: ${companyName}` : null,
    contact.interests ? `Interests: ${contact.interests}` : null,
    contact.family_notes ? `Family notes: ${contact.family_notes}` : null,
    contact.personal_notes ? `Personal notes: ${contact.personal_notes}` : null,
    contact.communication_preference
      ? `Preferred contact method: ${contact.communication_preference}`
      : null,
    contact.notes ? `General notes: ${contact.notes}` : null,
  ].filter(Boolean);

  const activityLines = (activities ?? []).map(
    (a) => `- [${a.activity_date?.slice(0, 10)}] ${a.type}: ${a.subject}${a.description ? " — " + a.description : ""}`
  );

  const prompt = `You are a relationship-management assistant for a business development professional at Momentum Atelier. Based on the profile and recent activity below, suggest ONE concrete next action to strengthen this relationship, and ONE natural conversation starter they could use. Be specific and reference real details from the notes when possible. Keep the whole response under 80 words. Do not use markdown headers.

PROFILE:
${profileLines.join("\n") || "No profile details recorded yet."}

RECENT ACTIVITY (most recent first):
${activityLines.join("\n") || "No activity logged yet."}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `AI provider error (${response.status}): ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = (data.content ?? [])
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({ suggestion: text || "No suggestion generated." });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error calling the AI provider." },
      { status: 502 }
    );
  }
}
