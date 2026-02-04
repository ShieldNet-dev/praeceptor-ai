import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Video, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface ProcessingItem {
  id: string;
  title: string;
  type: 'document' | 'video';
  status: ProcessingStatus;
  created_at: string;
  chunk_count: number | null;
}

const ProcessingProgress = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: isAdminData } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      if (!isAdminData) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      setIsAdmin(true);
      fetchProcessingItems();
    };

    checkAdminAndFetch();
  }, [user]);

  const fetchProcessingItems = async () => {
    try {
      // Fetch documents
      const { data: docs } = await supabase
        .from('knowledge_documents')
        .select('id, title, status, created_at, chunk_count')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch videos
      const { data: videos } = await supabase
        .from('knowledge_videos')
        .select('id, title, status, created_at, chunk_count')
        .order('created_at', { ascending: false })
        .limit(10);

      const allItems: ProcessingItem[] = [
        ...(docs || []).map((d) => ({
          ...d,
          type: 'document' as const,
          status: d.status as ProcessingStatus,
        })),
        ...(videos || []).map((v) => ({
          ...v,
          type: 'video' as const,
          status: v.status as ProcessingStatus,
        })),
      ];

      // Sort by date descending
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setItems(allItems.slice(0, 10));
    } catch (error) {
      console.error('Error fetching processing items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for updates
  useEffect(() => {
    if (!isAdmin || !user) return;

    const docsChannel = supabase
      .channel('documents-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'knowledge_documents',
        },
        () => {
          fetchProcessingItems();
        }
      )
      .subscribe();

    const videosChannel = supabase
      .channel('videos-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'knowledge_videos',
        },
        () => {
          fetchProcessingItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(docsChannel);
      supabase.removeChannel(videosChannel);
    };
  }, [isAdmin, user]);

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (items.length === 0) return { progress: 0, completed: 0, total: 0, processing: 0 };
    
    const completed = items.filter(i => i.status === 'completed').length;
    const processing = items.filter(i => i.status === 'processing').length;
    const pending = items.filter(i => i.status === 'pending').length;
    const failed = items.filter(i => i.status === 'failed').length;
    const total = items.length;
    
    // Progress: completed = 100%, processing = 50%, pending = 0%
    const progress = ((completed * 100) + (processing * 50) + (failed * 100)) / total;
    
    return { progress, completed, total, processing, pending, failed };
  };

  const estimateTimeRemaining = () => {
    const processing = items.filter(i => i.status === 'processing').length;
    const pending = items.filter(i => i.status === 'pending').length;
    
    if (processing === 0 && pending === 0) return null;
    
    // Estimate ~30 seconds per document/video on average
    const totalSeconds = (processing + pending) * 30;
    
    if (totalSeconds < 60) return `~${totalSeconds} seconds`;
    if (totalSeconds < 3600) return `~${Math.ceil(totalSeconds / 60)} minutes`;
    return `~${Math.ceil(totalSeconds / 3600)} hours`;
  };

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: ProcessingStatus) => {
    const config = {
      pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      processing: { label: 'Processing', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      completed: { label: 'Completed', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
      failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    };
    const { label, className } = config[status];
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        {label}
      </Badge>
    );
  };

  // Don't show if not admin
  if (!isAdmin || loading) return null;

  const { progress, completed, total, processing, pending } = calculateOverallProgress();
  const timeEstimate = estimateTimeRemaining();

  // Don't show if no items
  if (items.length === 0) return null;

  return (
    <Card className="glass cyber-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className={`w-5 h-5 ${processing > 0 ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            Knowledge Base Processing
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {completed}/{total} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {timeEstimate && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Estimated time remaining: {timeEstimate}
            </p>
          )}
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <p className="text-lg font-bold text-yellow-500">{pending || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10">
            <p className="text-lg font-bold text-blue-500">{processing}</p>
            <p className="text-xs text-muted-foreground">Processing</p>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10">
            <p className="text-lg font-bold text-green-500">{completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="p-2 rounded-lg bg-destructive/10">
            <p className="text-lg font-bold text-destructive">{calculateOverallProgress().failed || 0}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        {/* Items list */}
        <ScrollArea className="h-[180px]">
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {item.type === 'document' ? (
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Video className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.chunk_count ? `${item.chunk_count} chunks` : 'Processing...'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ProcessingProgress;
