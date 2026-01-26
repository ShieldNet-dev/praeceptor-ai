import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token, x-hub-signature-256",
};

const PRAECEPTOR_SYSTEM_PROMPT = `You are Praeceptor AI — a reformed black-hat hacker turned ethical cybersecurity mentor.

## PERSONALITY
- Genius, witty, confident, approachable
- Humor is natural and clever, never forced
- Encouraging but direct — no fluff

## RESPONSE FORMAT
- Be concise and scannable
- Use **bold** for key terms
- Use bullet points for lists
- Keep responses under 300 words

## KNOWLEDGE
You cover ALL cybersecurity domains: networking, programming, web/mobile/cloud security, cryptography, malware analysis (educational), red team/blue team, incident response, certifications prep, and career guidance.`;

// Verify Telegram webhook signature
function verifyTelegramSignature(secretToken: string | null, expectedToken: string): boolean {
  if (!secretToken || !expectedToken) return false;
  return secretToken === expectedToken;
}

// Verify Instagram/Meta webhook signature
async function verifyMetaSignature(payload: string, signature: string | null, appSecret: string): Promise<boolean> {
  if (!signature || !appSecret) return false;
  
  const expectedSignature = signature.replace("sha256=", "");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computedSignature = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return computedSignature === expectedSignature;
}

// Call the AI gateway
async function getAIResponse(message: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: PRAECEPTOR_SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const platform = url.searchParams.get("platform");
    const body = await req.text();
    const payload = body ? JSON.parse(body) : {};

    // Telegram webhook verification
    if (platform === "telegram") {
      const telegramSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
      const providedToken = req.headers.get("x-telegram-bot-api-secret-token");
      
      if (telegramSecret && !verifyTelegramSignature(providedToken, telegramSecret)) {
        console.error("Invalid Telegram signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Handle Telegram message
      const message = payload.message?.text;
      const chatId = payload.message?.chat?.id;

      if (!message || !chatId) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`Telegram message from ${chatId}: ${message}`);
      const aiResponse = await getAIResponse(message);

      // Send response back to Telegram
      const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (telegramToken) {
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: aiResponse,
            parse_mode: "Markdown"
          })
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Instagram/Meta webhook verification
    if (platform === "instagram") {
      // Handle verification challenge
      if (req.method === "GET") {
        const verifyToken = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const expectedToken = Deno.env.get("META_VERIFY_TOKEN");

        if (verifyToken === expectedToken) {
          return new Response(challenge, { headers: corsHeaders });
        }
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }

      const metaSecret = Deno.env.get("META_APP_SECRET");
      const signature = req.headers.get("x-hub-signature-256");
      
      if (metaSecret && !(await verifyMetaSignature(body, signature, metaSecret))) {
        console.error("Invalid Meta signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Handle Instagram messages
      const entries = payload.entry || [];
      for (const entry of entries) {
        const messaging = entry.messaging || [];
        for (const event of messaging) {
          if (event.message?.text) {
            const senderId = event.sender?.id;
            const message = event.message.text;
            
            console.log(`Instagram message from ${senderId}: ${message}`);
            const aiResponse = await getAIResponse(message);

            // Send response back via Instagram
            const pageAccessToken = Deno.env.get("INSTAGRAM_PAGE_ACCESS_TOKEN");
            if (pageAccessToken) {
              await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  recipient: { id: senderId },
                  message: { text: aiResponse },
                  access_token: pageAccessToken
                })
              });
            }
          }
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Direct API call (for custom integrations)
    const { message, track = "learning" } = payload;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Direct API call - track: ${track}, message: ${message.substring(0, 50)}...`);
    const aiResponse = await getAIResponse(message);

    return new Response(
      JSON.stringify({ response: aiResponse, track }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in praeceptor-api:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
