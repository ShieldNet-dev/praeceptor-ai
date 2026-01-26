import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RSS feed sources for cybersecurity news
const RSS_FEEDS = [
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/" },
  { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml" },
  { name: "Threatpost", url: "https://threatpost.com/feed/" },
  { name: "Security Week", url: "https://www.securityweek.com/feed/" },
];

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: string;
}

// Parse RSS XML to extract items
function parseRSS(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  // Simple regex-based parsing for RSS items
  const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  
  for (const itemXml of itemMatches.slice(0, 5)) { // Limit to 5 items per feed
    const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
    const link = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || "";
    const description = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || "";
    const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || "";
    const category = itemXml.match(/<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/i)?.[1]?.trim() || "Security";

    if (title && link) {
      items.push({
        title: title.replace(/<[^>]+>/g, ""),
        link: link.replace(/<[^>]+>/g, ""),
        description: description.replace(/<[^>]+>/g, "").substring(0, 200) + "...",
        pubDate,
        source: sourceName,
        category: category.replace(/<[^>]+>/g, "") || "Security",
      });
    }
  }
  
  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || "all";
    const limit = parseInt(url.searchParams.get("limit") || "20");

    console.log(`Fetching cybersecurity news - category: ${category}, limit: ${limit}`);

    const allNews: NewsItem[] = [];

    // Fetch from all RSS feeds in parallel
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          headers: { "User-Agent": "Praeceptor-AI-NewsBot/1.0" }
        });
        
        if (!response.ok) {
          console.warn(`Failed to fetch ${feed.name}: ${response.status}`);
          return [];
        }
        
        const xml = await response.text();
        return parseRSS(xml, feed.name);
      } catch (error) {
        console.warn(`Error fetching ${feed.name}:`, error);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    results.forEach(items => allNews.push(...items));

    // Sort by date (newest first)
    allNews.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    });

    // Limit results
    const limitedNews = allNews.slice(0, limit);

    console.log(`Returning ${limitedNews.length} news items`);

    return new Response(
      JSON.stringify({ 
        news: limitedNews,
        sources: RSS_FEEDS.map(f => f.name),
        fetchedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error fetching news:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch news";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
