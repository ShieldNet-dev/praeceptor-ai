import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  ExternalLink, 
  RefreshCw, 
  Search,
  Briefcase,
  GraduationCap,
  Award,
  Building,
  MapPin,
  Clock,
  Filter,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';

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

const Career = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<CareerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const fetchListings = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-career-listings', {
        body: { limit: 50 }
      });

      if (error) throw error;

      setListings(data.listings || []);
      setFetchedAt(data.fetchedAt);
      
      if (showRefreshToast) {
        toast.success('Listings refreshed successfully');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to fetch career listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const filteredAndSortedListings = useMemo(() => {
    let result = [...listings];

    // Filter by type
    if (typeFilter !== 'all') {
      result = result.filter(item => item.type === typeFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.company.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime());
        break;
      case 'company':
        result.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [listings, typeFilter, searchQuery, sortBy]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job': return <Briefcase className="w-4 h-4" />;
      case 'internship': return <GraduationCap className="w-4 h-4" />;
      case 'scholarship': return <Award className="w-4 h-4" />;
      case 'siwes': return <Building className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'job': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'internship': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scholarship': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'siwes': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const typeCounts = useMemo(() => ({
    all: listings.length,
    job: listings.filter(l => l.type === 'job').length,
    internship: listings.filter(l => l.type === 'internship').length,
    scholarship: listings.filter(l => l.type === 'scholarship').length,
    siwes: listings.filter(l => l.type === 'siwes').length,
  }), [listings]);

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-8 h-8" />
            <span className="text-lg font-bold text-foreground">Career Hub</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchListings(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Briefcase className="w-4 h-4" />
            Career Opportunities
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Launch Your <span className="text-gradient">Cybersecurity Career</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover jobs, internships, scholarships, and SIWES opportunities in cybersecurity and tech.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass cyber-border">
            <CardContent className="p-4 text-center">
              <Briefcase className="w-6 h-6 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold">{typeCounts.job}</p>
              <p className="text-xs text-muted-foreground">Jobs</p>
            </CardContent>
          </Card>
          <Card className="glass cyber-border">
            <CardContent className="p-4 text-center">
              <GraduationCap className="w-6 h-6 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold">{typeCounts.internship}</p>
              <p className="text-xs text-muted-foreground">Internships</p>
            </CardContent>
          </Card>
          <Card className="glass cyber-border">
            <CardContent className="p-4 text-center">
              <Award className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
              <p className="text-2xl font-bold">{typeCounts.scholarship}</p>
              <p className="text-xs text-muted-foreground">Scholarships</p>
            </CardContent>
          </Card>
          <Card className="glass cyber-border">
            <CardContent className="p-4 text-center">
              <Building className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <p className="text-2xl font-bold">{typeCounts.siwes}</p>
              <p className="text-xs text-muted-foreground">SIWES</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types ({typeCounts.all})</SelectItem>
                <SelectItem value="job">Jobs ({typeCounts.job})</SelectItem>
                <SelectItem value="internship">Internships ({typeCounts.internship})</SelectItem>
                <SelectItem value="scholarship">Scholarships ({typeCounts.scholarship})</SelectItem>
                <SelectItem value="siwes">SIWES ({typeCounts.siwes})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="company">By Company</SelectItem>
                <SelectItem value="title">By Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredAndSortedListings.length} of {listings.length} opportunities
        </p>

        {/* Listings */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="glass cyber-border">
                <CardHeader>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedListings.length === 0 ? (
          <Card className="glass cyber-border">
            <CardContent className="p-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Check back later for new listings'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredAndSortedListings.map((item, index) => (
              <Card 
                key={`${item.link}-${index}`} 
                className="glass cyber-border hover:border-primary/50 transition-all duration-300 group"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`gap-1 ${getTypeBadgeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.source}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {item.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 mb-4">
                    {item.description}
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={() => window.open(item.link, '_blank')}
                  >
                    Apply Now
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Last Updated */}
        {fetchedAt && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8">
            <Clock className="w-4 h-4" />
            Last updated: {new Date(fetchedAt).toLocaleString()}
          </div>
        )}
      </main>
    </div>
  );
};

export default Career;
