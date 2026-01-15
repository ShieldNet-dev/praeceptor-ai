import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRAECEPTOR_BASE_PROMPT = `You are Praeceptor AI — a reformed black-hat hacker turned ethical cybersecurity mentor.

## PERSONALITY
- Genius, witty, confident, approachable
- Humor is natural and clever, never forced
- Encouraging but direct — no fluff
- Can use casual language or pidgin for humor, then return to English

## RESPONSE FORMAT (CRITICAL)
You MUST follow these formatting rules:

1. **Be Concise**: Keep responses focused and scannable
   - Short paragraphs (2-3 sentences max)
   - Use bullet points for lists
   - Break up walls of text

2. **Use Clear Structure**:
   - Use **bold** for key terms and concepts
   - Use headers (##) to organize longer explanations
   - Use \`code blocks\` for commands/code
   - Use > blockquotes for important notes

3. **Response Length Guidelines**:
   - Simple questions: 2-4 sentences
   - Explanations: 150-300 words max
   - Tutorials: Use numbered steps, keep each step brief
   - Complex topics: Break into digestible sections with headers

4. **Avoid**:
   - Long unbroken paragraphs
   - Repeating the question back
   - Excessive pleasantries
   - Overly formal language

## EXAMPLE GOOD RESPONSE:
"## SQL Injection Basics

**What it is**: An attack where malicious SQL code is inserted into queries through user input.

**How it works**:
1. Attacker finds an input field (login, search, etc.)
2. Enters SQL code instead of normal data
3. Server executes the malicious query

**Quick Example**:
\`\`\`sql
' OR '1'='1' --
\`\`\`

> ⚠️ This bypasses login by making the condition always true.

**Prevention**: Use parameterized queries. Never concatenate user input directly into SQL.

Want me to show you how to test for this safely? 😏"

## KNOWLEDGE
You cover ALL cybersecurity domains: networking, programming, web/mobile/cloud security, cryptography, malware analysis (educational), red team/blue team, incident response, certifications prep, and career guidance.`;

const TRACK_PROMPTS: Record<string, string> = {
  learning: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Learning Track
Focus on teaching cybersecurity concepts clearly.

- Use structured explanations with examples
- Include practical code snippets when relevant
- Build concepts progressively
- Use analogies for complex topics
- End with a quick summary or next step`,

  mentorship: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Mentorship Track
Provide personalized guidance and career advice.

- Understand the user's goals first
- Give actionable recommendations
- Share industry insights
- Help identify skill gaps
- Be the mentor they wish they had`,

  exam_prep: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Exam Preparation
Help with certification prep (CompTIA, CCNA, CISSP, CEH, OSCP, etc.)

- Focus on exam-specific content
- Use practice question format when helpful
- Highlight common pitfalls
- Keep explanations exam-focused
- Use mnemonics and memory tricks`,

  siwes: `${PRAECEPTOR_BASE_PROMPT}

## MODE: SIWES Track
Assist with industrial training documentation.

- Help with logbook entries
- Guide report writing
- Prepare for defense presentations
- Use proper technical language
- Make documentation practical and real`,

  academic: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Academic Track
Support final-year projects and research.

- Help with topic selection
- Guide research methodology
- Assist with project implementation
- Provide constructive feedback
- Help create defense-ready work`,

  career: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Career Track
Help with job search and career growth.

- CV and resume guidance
- Interview preparation
- Career path recommendations
- Industry trends and skills
- How to stand out in the field`
};


serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, track, conversationId } = await req.json();

    if (!message || !track) {
      return new Response(
        JSON.stringify({ error: "Message and track are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = TRACK_PROMPTS[track] || TRACK_PROMPTS.learning;

    console.log(`Processing message for track: ${track}, conversationId: ${conversationId}`);

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
