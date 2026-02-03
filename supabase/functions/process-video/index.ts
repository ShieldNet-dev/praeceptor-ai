import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start = end - overlap;
    if (start >= text.length - overlap) break;
  }
  
  return chunks;
}

// Parse SRT format
function parseSRT(content: string): string {
  const lines = content.split('\n');
  const textLines: string[] = [];
  let isTextLine = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and numeric indices
    if (!trimmed || /^\d+$/.test(trimmed)) {
      isTextLine = false;
      continue;
    }
    
    // Skip timestamp lines
    if (trimmed.includes('-->')) {
      isTextLine = true;
      continue;
    }
    
    if (isTextLine) {
      // Remove HTML tags and add text
      const cleanText = trimmed.replace(/<[^>]*>/g, '');
      if (cleanText) {
        textLines.push(cleanText);
      }
    }
  }
  
  return textLines.join(' ');
}

// Parse VTT format
function parseVTT(content: string): string {
  // Remove WEBVTT header and metadata
  const lines = content.split('\n');
  const textLines: string[] = [];
  let isTextLine = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip WEBVTT header, empty lines, and metadata
    if (!trimmed || trimmed === 'WEBVTT' || trimmed.startsWith('NOTE')) {
      isTextLine = false;
      continue;
    }
    
    // Skip timestamp lines
    if (trimmed.includes('-->')) {
      isTextLine = true;
      continue;
    }
    
    // Skip cue settings (lines with identifiers)
    if (/^[a-zA-Z-]+:/.test(trimmed)) {
      continue;
    }
    
    if (isTextLine) {
      // Remove HTML tags and add text
      const cleanText = trimmed.replace(/<[^>]*>/g, '');
      if (cleanText) {
        textLines.push(cleanText);
      }
    }
  }
  
  return textLines.join(' ');
}

// Extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Fetch YouTube transcript (simplified - in production use YouTube API)
async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    // Try to fetch video page and extract transcript data
    // This is a simplified approach - in production, use YouTube Data API
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    // Look for transcript/caption data in the page
    // This is a basic extraction - YouTube's actual API would be more reliable
    const captionMatch = html.match(/"captionTracks":\s*(\[[^\]]+\])/);
    
    if (captionMatch) {
      try {
        const tracks = JSON.parse(captionMatch[1]);
        if (tracks.length > 0 && tracks[0].baseUrl) {
          const captionResponse = await fetch(tracks[0].baseUrl);
          const captionXml = await captionResponse.text();
          
          // Parse XML captions
          const textMatches = captionXml.match(/<text[^>]*>([^<]*)<\/text>/g) || [];
          const texts = textMatches.map(m => {
            const text = m.replace(/<[^>]*>/g, '');
            return decodeURIComponent(text.replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)));
          });
          
          return texts.join(' ');
        }
      } catch (e) {
        console.error("Failed to parse caption tracks:", e);
      }
    }
    
    return null;
  } catch (error) {
    console.error("Failed to fetch YouTube transcript:", error);
    return null;
  }
}

// Generate embedding (same as document processing)
async function generateEmbedding(text: string): Promise<number[]> {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "videoId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing video: ${videoId}`);

    // Update status to processing
    await supabase
      .from("knowledge_videos")
      .update({ status: "processing" })
      .eq("id", videoId);

    // Get video info
    const { data: video, error: videoError } = await supabase
      .from("knowledge_videos")
      .select("*")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      throw new Error("Video not found");
    }

    let transcript = "";

    // If caption file is provided, use it
    if (video.caption_file_path) {
      const { data: captionData, error: downloadError } = await supabase.storage
        .from("knowledge-captions")
        .download(video.caption_file_path);

      if (downloadError || !captionData) {
        throw new Error(`Failed to download caption file: ${downloadError?.message}`);
      }

      const captionText = await captionData.text();
      
      // Parse based on file extension
      if (video.caption_file_name?.endsWith('.srt')) {
        transcript = parseSRT(captionText);
      } else if (video.caption_file_name?.endsWith('.vtt')) {
        transcript = parseVTT(captionText);
      } else {
        // Try both formats
        transcript = parseSRT(captionText) || parseVTT(captionText) || captionText;
      }
    }
    // If YouTube URL, try to fetch transcript
    else if (video.video_url && video.platform === 'youtube') {
      const ytId = extractYouTubeId(video.video_url);
      if (ytId) {
        const ytTranscript = await fetchYouTubeTranscript(ytId);
        if (ytTranscript) {
          transcript = ytTranscript;
        } else {
          throw new Error("Could not fetch YouTube transcript. Try uploading a caption file instead.");
        }
      } else {
        throw new Error("Invalid YouTube URL");
      }
    } else {
      throw new Error("No caption file or supported video URL provided");
    }

    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Could not extract transcript from video");
    }

    console.log(`Extracted ${transcript.length} characters from video`);

    // Delete existing chunks for this video
    await supabase
      .from("knowledge_chunks")
      .delete()
      .eq("source_type", "video")
      .eq("source_id", videoId);

    // Chunk the transcript
    const chunks = chunkText(transcript);
    console.log(`Created ${chunks.length} chunks`);

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);

      await supabase.from("knowledge_chunks").insert({
        source_type: "video",
        source_id: videoId,
        content: chunk,
        chunk_index: i,
        embedding: embedding,
        metadata: {
          title: video.title,
          video_url: video.video_url,
          platform: video.platform,
          chunk_of: chunks.length,
        },
      });
    }

    // Update video status
    await supabase
      .from("knowledge_videos")
      .update({
        status: "completed",
        chunk_count: chunks.length,
        error_message: null,
      })
      .eq("id", videoId);

    console.log(`Video ${videoId} processed successfully`);

    return new Response(
      JSON.stringify({ success: true, chunks: chunks.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing video:", error);

    // Try to update status to failed
    try {
      const { videoId } = await req.clone().json();
      if (videoId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from("knowledge_videos")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", videoId);
      }
    } catch (e) {
      console.error("Failed to update error status:", e);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
