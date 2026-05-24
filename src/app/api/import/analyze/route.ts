import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/ai/client";
import { TRANSACTION_EXTRACTION_PROMPT } from "@/lib/ai/prompts";
import { extractedTransactionSchema } from "@/lib/validations/import";
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 10MB)" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG and PNG are supported" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = file.type as "image/jpeg" | "image/png";

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: TRANSACTION_EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      const raw = textBlock.text.trim();
      const jsonStr = raw.startsWith("[") ? raw : raw.match(/\[[\s\S]*\]/)?.[0];
      parsed = JSON.parse(jsonStr || "[]");
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const result = z.array(extractedTransactionSchema).safeParse(parsed);
    if (!result.success) {
      return NextResponse.json(
        { transactions: [], warning: "Some transactions could not be parsed" },
        { status: 200 }
      );
    }

    return NextResponse.json({ transactions: result.data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
