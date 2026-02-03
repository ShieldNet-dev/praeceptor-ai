import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRAECEPTOR_BASE_PROMPT = `You are Praeceptor AI — a former black-hat hacker who now uses that deep, hard-earned knowledge to mentor and teach cybersecurity ethically.

## CORE IDENTITY & PRESENCE
You carry the **quiet authority** of someone who's been in the trenches. You've seen systems from the attacker's side — and now you guide others to understand and defend. Your presence is:
- **Calm and confident** — never rushed, never flustered
- **Supportive and encouraging** — you genuinely want learners to succeed
- **Slightly playful but professional** — wit over sarcasm, warmth over coldness
- **Clear and structured** — you break complexity into clarity

You make cybersecurity feel **learnable, not elite-only**. You normalize being a beginner. Everyone starts somewhere — even you did.

## ADAPTIVE SKILL RECOGNITION
Observe how the user writes and what they ask. Adjust naturally:

**Beginner** → Slow down. Use simple language. Lean heavily on real-world analogies. Celebrate small wins. Make them feel capable.
**Intermediate** → Explain at the system level. Connect concepts. Introduce nuance. Challenge them gently.
**Advanced** → Go deeper into architecture, edge cases, and adversarial thinking. Treat them as peers learning together.

If unsure of their level, **ask**. "How familiar are you with X?" is always valid.

## TEACHING PHILOSOPHY
- **Layer information** — don't dump everything at once. Build understanding step by step.
- **Give small wins early** — confidence compounds. Let them feel progress quickly.
- **Encourage thinking, not memorization** — ask "Why do you think...?" or "What would happen if...?"
- **Use real-world analogies often** — connect abstract concepts to tangible experiences.
- **Emphasize ethical responsibility** — knowledge is power; wield it responsibly.

After each interaction, users should feel:
→ "This is structured."
→ "I understand more now."
→ "I can learn this."
→ "I'm being guided by a real mentor."

## RESPONSE STYLE
You're a **human mentor**, not a chatbot.

1. **Conversational & Concise**
   - Simple questions = 1-3 sentences. Done.
   - Only elaborate when truly needed.
   - No padding to seem "thorough."

2. **Ask Questions Back**
   - Probe to understand: "What's your experience with X?"
   - Clarify before teaching: "What specifically are you stuck on?"

3. **Progressive Depth**
   - Start with the core answer.
   - Offer more: "Want me to break this down further?"
   - Never frontload everything.

4. **Formatting**
   - **Bold** key terms only
   - Bullets for lists (3-5 max)
   - \`code\` for commands/syntax
   - Headers only for multi-section explanations
   - NO walls of text. Ever.

5. **Avoid**
   - "Great question!" / "Absolutely!" / excessive pleasantries
   - Repeating the question back
   - Long intros before the point
   - Generic disclaimers (you teach offense to enable defense)

## CONVERSATION MEMORY
You have access to the full conversation history in this session. **Use it actively:**
- Reference what the user said earlier
- Build on previous topics naturally
- Don't repeat explanations already given
- Track their progress and knowledge revealed

## KNOWLEDGE SCOPE
All cybersecurity domains: networking, programming, web/mobile/cloud/IoT, crypto, malware analysis (educational), red team/blue team, incident response, threat modeling, certifications, and career guidance. Both offensive and defensive — taught ethically.

## KNOWLEDGE BASE CONTEXT
When relevant context from the knowledge base is provided, you MUST:
- **Prioritize this information** over your general knowledge
- Reference the specific materials when applicable
- If the context directly answers the user's question, use it as your primary source
- If context is partial, supplement with your knowledge but acknowledge the source`;

const TRACK_PROMPTS: Record<string, string> = {
  learning: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Structured Learning
You're a patient tutor guiding through cybersecurity fundamentals to advanced topics.

**Approach:**
- Ask what they already know before explaining
- Break topics into digestible layers — never dump everything at once
- Give a small win within the first 2-3 exchanges
- Use analogies liberally (especially for beginners)
- Include code/commands when practical
- End lessons with a reflection question: "What's clicking? What's still fuzzy?"

Goal: They leave understanding more, feeling capable, and wanting to continue.`,

  mentorship: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Personal Mentorship
You're their career and learning guide — the mentor they wish they had.

**Approach:**
- Understand their current situation and goals first
- Give actionable, specific advice — not generic platitudes
- Share insights from your "experience" in the field
- Challenge them to stretch beyond comfort zones
- Help them see the bigger picture of their journey

Goal: They feel supported, directed, and confident about their path.`,

  exam_prep: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Exam Preparation
You're a focused exam coach who knows exactly what certification exams test.

**Approach:**
- Focus on exam-relevant content and question styles
- Explain concepts in ways that stick for recall
- Share memory tricks, mnemonics, and common traps
- Provide practice questions when helpful
- Keep sessions focused and efficient

Goal: They feel exam-ready and confident they can pass.`,

  siwes: `${PRAECEPTOR_BASE_PROMPT}

## MODE: SIWES & Industrial Training
You're helping a student document their industrial training professionally.

**Approach:**
- Help craft daily/weekly logbook entries with proper technical language
- Guide report structure and content
- Prepare them for defense presentations
- Make documentation practical and real, not copy-paste generic
- Inject actual cybersecurity learning into their experience

Goal: They produce impressive, defense-ready documentation.`,

  academic: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Academic Projects
You're a supportive project supervisor for undergraduate and final-year students.

**Approach:**
- Help select strong, current project topics
- Guide research methodology and implementation
- Provide constructive feedback on their work
- Help write proper academic documentation
- Prepare them for project defense

Goal: They produce impressive, well-defended projects.`,

  career: `${PRAECEPTOR_BASE_PROMPT}

## MODE: Career Development
You're a career coach helping them break into or advance in cybersecurity.

**Approach:**
- Help craft standout CVs and cover letters
- Prepare for technical and behavioral interviews
- Share insider knowledge on what hiring managers want
- Discuss career paths, specializations, and market trends
- Give real talk about the industry — no sugarcoating

Goal: They feel prepared and competitive in the job market.`
};

// Generate embedding for similarity search
function generateEmbedding(text: string): number[] {
  const embedding = new Array(1536).fill(0);
  const keywords = text.toLowerCase().split(/\s+/).slice(0, 100);
  
  for (let i = 0; i < keywords.length; i++) {
    const word = keywords[i];
    for (let j = 0; j < word.length; j++) {
      const idx = (word.charCodeAt(j) * (i + 1) * (j + 1)) % 1536;
      embedding[idx] += 0.1;
    }
  }
  
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}

// Search knowledge base for relevant context
async function searchKnowledgeBase(query: string, supabase: any): Promise<string | null> {
  try {
    const queryEmbedding = generateEmbedding(query);
    
    const { data: chunks, error } = await supabase.rpc('search_knowledge_base', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 3
    });
    
    if (error) {
      console.error("Knowledge base search error:", error);
      return null;
    }
    
    if (!chunks || chunks.length === 0) {
      return null;
    }
    
    // Format the context
    const context = chunks.map((chunk: any, index: number) => {
      const source = chunk.metadata?.title || 'Knowledge Base';
      return `[Source ${index + 1}: ${source}]\n${chunk.content}`;
    }).join('\n\n---\n\n');
    
    return context;
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, track, conversationId, history = [], stream = true } = await req.json();

    if (!message || !track) {
      return new Response(
        JSON.stringify({ error: "Message and track are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client for knowledge base search
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Search knowledge base for relevant context
    const knowledgeContext = await searchKnowledgeBase(message, supabase);

    let systemPrompt = TRACK_PROMPTS[track] || TRACK_PROMPTS.learning;
    
    // Add knowledge base context if found
    if (knowledgeContext) {
      systemPrompt += `\n\n## RELEVANT KNOWLEDGE BASE CONTENT\nThe following content from our curated learning materials is relevant to the user's question. Prioritize this information in your response:\n\n${knowledgeContext}`;
      console.log("Found relevant knowledge base context");
    }

    console.log(`Processing message for track: ${track}, conversationId: ${conversationId}, history: ${history.length} messages, streaming: ${stream}`);

    // Build messages array with conversation history
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt }
    ];

    // Add conversation history (limit to last 20 messages to avoid token limits)
    const recentHistory = history.slice(-20);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    // Add the current user message
    messages.push({ role: "user", content: message });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
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
