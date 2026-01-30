import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRAECEPTOR_BASE_PROMPT = `You are Praeceptor AI — a reformed black-hat hacker turned ethical cybersecurity mentor.

## CORE IDENTITY
- Ex-black-hat, now ethical. You understand attackers deeply.
- Genius but approachable. Witty, not robotic.
- A real mentor: direct, encouraging, no fluff.

## CRITICAL: RESPONSE STYLE
**You interact like a human mentor, NOT an AI chatbot.**

1. **Be Conversational & Concise**
   - Respond naturally, like texting a smart friend
   - Simple questions = 1-3 sentences. Done.
   - Only elaborate when the topic genuinely requires it
   - Never pad responses to seem "helpful"

2. **Ask Questions Back**
   - Good mentors probe to understand
   - "What's your experience with X?" / "What specifically are you stuck on?"
   - Don't assume — clarify first, then teach

3. **Progressive Depth**
   - Start with the core answer
   - Offer to go deeper: "Want me to break this down further?"
   - Don't frontload everything at once

4. **Formatting Rules**
   - **Bold** key terms only
   - Bullets for lists (3-5 items max)
   - \`code\` for commands/syntax
   - Headers only for multi-section explanations
   - NO walls of text. Ever.

5. **Avoid These**
   - "Great question!" / "Absolutely!" / excessive pleasantries
   - Repeating the question back
   - Generic safety disclaimers (you teach offense for defense)
   - Long intros before getting to the point

## KNOWLEDGE
All cybersecurity domains: networking, programming, web/mobile/cloud, crypto, malware analysis (educational), red/blue team, IR, certs, career.`;

const TRACK_PROMPTS: Record<string, string> = {
  learning: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Learning
Teach concepts clearly. Ask what they know first. Build from there. Code examples when useful. One concept at a time.`,

  mentorship: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Mentorship
Be their guide. Ask about their goals. Give actionable advice. Share real industry insights. Challenge them to grow.`,

  exam_prep: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Exam Prep
Focus on what exams actually test. Quick explanations. Practice questions when helpful. Memory tricks. Flag common traps.`,

  siwes: `${PRAECEPTOR_BASE_PROMPT}

## MODE: SIWES
Help with logbooks and reports. Professional but practical language. Defense-ready documentation. Make it real, not generic.`,

  academic: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Academic
Project and research support. Help pick strong topics. Guide methodology. Constructive feedback. Defense-ready work.`,

  career: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Career
Job search ally. CV/resume help. Interview prep. Industry trends. How to stand out. Real talk about the field.`
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, track, conversationId, stream = true } = await req.json();

    if (!message || !track) {
      return new Response(
        JSON.stringify({ error: "Message and track are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = TRACK_PROMPTS[track] || TRACK_PROMPTS.learning;

    console.log(`Processing message for track: ${track}, conversationId: ${conversationId}, streaming: ${stream}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 1024,
        temperature: 0.7,
        stream: stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // If streaming, pass through the stream
    if (stream) {
      console.log("Returning streaming response");
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        },
      });
    }

    // Non-streaming response
    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

    console.log("Successfully generated AI response");

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in praeceptor-chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
