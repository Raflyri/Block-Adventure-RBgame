/**
 * ============================================================================
 * Cloudflare Pages Function: /api/shoutcaster
 * Calls Google Gemini API (gemini-2.5-flash) to generate dynamic Indonesian
 * e-sports shoutcaster commentary based on real-time RBlock Adventure state.
 * Environment Variable required in Cloudflare Pages: GEMINI_API_KEY
 * ============================================================================
 */

const SYSTEM_INSTRUCTION =
  "Kamu adalah komentator game e-sports yang ceria, kocak, dan menyemangati. Berikan komentar 1 kalimat singkat dalam bahasa Indonesia berdasarkan status papan game saat ini.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function onRequestPost(context) {
  try {
    const apiKey =
      context.env?.GEMINI_API_KEY ||
      context.env?.VITE_GEMINI_API_KEY ||
      context.env?.GOOGLE_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          source: "no_server_key",
          comment: null
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const body = await context.request.json();
    const prompt = (body.prompt || "").toString().trim().slice(0, 600);

    if (!prompt) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing prompt" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 80,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          source: "gemini_http_error",
          status: response.status,
          comment: null
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const data = await response.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;

    return new Response(
      JSON.stringify({
        success: Boolean(rawText),
        source: "gemini_api",
        comment: rawText ? rawText.replace(/^["']|["']$/g, "") : null
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        source: "server_exception",
        error: error.message || "Failed to generate commentary",
        comment: null
      }),
      { status: 200, headers: corsHeaders }
    );
  }
}
