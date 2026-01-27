import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Job board RSS feeds and sources
const JOB_SOURCES = [
  { name: "Indeed Cybersecurity", url: "https://www.indeed.com/rss?q=cybersecurity&l=remote", category: "jobs" },
  { name: "CyberSecJobs", url: "https://www.cybersecjobs.com/rss/all", category: "jobs" },
  { name: "InfoSec Jobs", url: "https://infosec-jobs.com/feed/", category: "jobs" },
];

const SCHOLARSHIP_SOURCES = [
  { name: "CyberCorps", url: "https://www.sfs.opm.gov/", category: "scholarships" },
];

interface CareerItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: string;
  type: "job" | "internship" | "scholarship" | "siwes";
  location: string;
  company: string;
}

// Parse RSS XML
function parseRSS(xml: string, sourceName: string, type: "job" | "internship" | "scholarship" | "siwes"): CareerItem[] {
  const items: CareerItem[] = [];
  const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  
  for (const itemXml of itemMatches.slice(0, 10)) {
    const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
    const link = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || "";
    const description = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || "";
    const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || "";

    if (title && link) {
      // Extract company and location from title/description if possible
      const companyMatch = title.match(/at\s+([^-–]+)/i) || description.match(/Company:\s*([^<\n]+)/i);
      const locationMatch = title.match(/[-–]\s*([^-–]+)$/i) || description.match(/Location:\s*([^<\n]+)/i);

      items.push({
        title: title.replace(/<[^>]+>/g, "").substring(0, 150),
        link: link.replace(/<[^>]+>/g, ""),
        description: description.replace(/<[^>]+>/g, "").substring(0, 250) + "...",
        pubDate,
        source: sourceName,
        category: "cybersecurity",
        type,
        company: companyMatch?.[1]?.trim() || "Various Companies",
        location: locationMatch?.[1]?.trim() || "Remote/Various",
      });
    }
  }
  
  return items;
}

// Generate curated listings when RSS fails
function generateCuratedListings(): CareerItem[] {
  const now = new Date().toISOString();
  
  return [
    // Jobs
    {
      title: "Security Analyst - Entry Level",
      link: "https://www.linkedin.com/jobs/search/?keywords=security%20analyst%20entry%20level",
      description: "Entry-level security analyst positions available. Monitor security systems, analyze threats, and respond to incidents.",
      pubDate: now,
      source: "LinkedIn",
      category: "cybersecurity",
      type: "job",
      company: "Multiple Companies",
      location: "Remote/Hybrid"
    },
    {
      title: "Penetration Tester",
      link: "https://www.linkedin.com/jobs/search/?keywords=penetration%20tester",
      description: "Ethical hacking roles testing security of applications and networks. CEH or OSCP certification preferred.",
      pubDate: now,
      source: "LinkedIn",
      category: "cybersecurity",
      type: "job",
      company: "Security Firms",
      location: "Worldwide"
    },
    {
      title: "SOC Analyst",
      link: "https://www.indeed.com/jobs?q=SOC+Analyst",
      description: "Security Operations Center positions monitoring and responding to security events 24/7.",
      pubDate: now,
      source: "Indeed",
      category: "cybersecurity",
      type: "job",
      company: "Various",
      location: "Remote Available"
    },
    {
      title: "Cloud Security Engineer",
      link: "https://www.linkedin.com/jobs/search/?keywords=cloud%20security%20engineer",
      description: "Design and implement security for AWS, Azure, or GCP environments. Cloud certifications valued.",
      pubDate: now,
      source: "LinkedIn",
      category: "cybersecurity",
      type: "job",
      company: "Tech Companies",
      location: "Global"
    },
    // Internships
    {
      title: "Cybersecurity Summer Internship 2026",
      link: "https://www.linkedin.com/jobs/search/?keywords=cybersecurity%20internship",
      description: "Summer internship programs at major tech companies. Learn from industry experts and gain hands-on experience.",
      pubDate: now,
      source: "LinkedIn",
      category: "cybersecurity",
      type: "internship",
      company: "Big Tech & Security Firms",
      location: "Various Locations"
    },
    {
      title: "Google Security Internship",
      link: "https://careers.google.com/jobs/results/?q=security%20intern",
      description: "Join Google's security team as an intern. Work on real security challenges at scale.",
      pubDate: now,
      source: "Google Careers",
      category: "cybersecurity",
      type: "internship",
      company: "Google",
      location: "Multiple Offices"
    },
    {
      title: "Microsoft Security Internship",
      link: "https://careers.microsoft.com/professionals/us/en/c/security-jobs",
      description: "Security internship opportunities at Microsoft. Defend billions of users worldwide.",
      pubDate: now,
      source: "Microsoft Careers",
      category: "cybersecurity",
      type: "internship",
      company: "Microsoft",
      location: "Redmond, WA / Remote"
    },
    // Scholarships
    {
      title: "CyberCorps: Scholarship for Service",
      link: "https://www.sfs.opm.gov/",
      description: "Full scholarship for cybersecurity studies in exchange for government service. Covers tuition, stipend, and more.",
      pubDate: now,
      source: "US Government",
      category: "scholarship",
      type: "scholarship",
      company: "Federal Government",
      location: "USA"
    },
    {
      title: "(ISC)² Cybersecurity Scholarships",
      link: "https://www.isc2.org/scholarships",
      description: "Scholarships for cybersecurity students pursuing certifications and degrees.",
      pubDate: now,
      source: "(ISC)²",
      category: "scholarship",
      type: "scholarship",
      company: "(ISC)²",
      location: "International"
    },
    {
      title: "SANS Cyber Academy",
      link: "https://www.sans.org/cyberacademy/",
      description: "Free training programs and scholarships for underrepresented groups in cybersecurity.",
      pubDate: now,
      source: "SANS Institute",
      category: "scholarship",
      type: "scholarship",
      company: "SANS",
      location: "Online"
    },
    {
      title: "Women in CyberSecurity (WiCyS) Scholarship",
      link: "https://www.wicys.org/",
      description: "Scholarships and mentorship for women pursuing cybersecurity careers.",
      pubDate: now,
      source: "WiCyS",
      category: "scholarship",
      type: "scholarship",
      company: "WiCyS",
      location: "USA"
    },
    // SIWES
    {
      title: "IT/Cybersecurity SIWES Placement - Banks",
      link: "https://www.linkedin.com/jobs/search/?keywords=IT%20intern%20Nigeria",
      description: "Industrial training placements at Nigerian banks. Gain experience in financial security operations.",
      pubDate: now,
      source: "Various Banks",
      category: "siwes",
      type: "siwes",
      company: "Nigerian Banks",
      location: "Nigeria"
    },
    {
      title: "NITDA Cybersecurity Training Program",
      link: "https://nitda.gov.ng/",
      description: "Government-sponsored cybersecurity training for Nigerian students and graduates.",
      pubDate: now,
      source: "NITDA",
      category: "siwes",
      type: "siwes",
      company: "NITDA",
      location: "Nigeria"
    },
    {
      title: "Tech Company SIWES - Lagos",
      link: "https://www.linkedin.com/jobs/search/?keywords=SIWES%20IT%20Lagos",
      description: "IT and security internship placements at tech startups and companies in Lagos.",
      pubDate: now,
      source: "Tech Startups",
      category: "siwes",
      type: "siwes",
      company: "Various Tech Companies",
      location: "Lagos, Nigeria"
    },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all";
    const limit = parseInt(url.searchParams.get("limit") || "50");

    console.log(`Fetching career listings - type: ${type}, limit: ${limit}`);

    let allListings: CareerItem[] = [];

    // Try to fetch from RSS feeds
    for (const source of JOB_SOURCES) {
      try {
        const response = await fetch(source.url, {
          headers: { "User-Agent": "Praeceptor-AI-CareerBot/1.0" }
        });
        
        if (response.ok) {
          const xml = await response.text();
          const items = parseRSS(xml, source.name, "job");
          allListings.push(...items);
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${source.name}:`, error);
      }
    }

    // Always add curated listings to ensure content
    const curatedListings = generateCuratedListings();
    allListings.push(...curatedListings);

    // Remove duplicates by title
    const seen = new Set();
    allListings = allListings.filter(item => {
      const key = item.title.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filter by type if specified
    if (type !== "all") {
      allListings = allListings.filter(item => item.type === type);
    }

    // Sort by date (newest first)
    allListings.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    });

    // Limit results
    const limitedListings = allListings.slice(0, limit);

    console.log(`Returning ${limitedListings.length} career listings`);

    return new Response(
      JSON.stringify({ 
        listings: limitedListings,
        types: ["job", "internship", "scholarship", "siwes"],
        fetchedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error fetching career listings:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch listings";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
